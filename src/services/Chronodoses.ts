/// <reference path="../../types.d.ts" />

import {getTime, parseISO} from "date-fns";
import {abs, sum} from "mathjs";
import {Historique} from "./Historique";

type DureeParRdv = {
    duree: number;
    appointments: number;
    chronodoseAppointments: number;
};

export class Chronodoses {
    public static readonly INSTANCE = new Chronodoses();
    private constructor() {
    }

    private calculerStatsLieuxRecentes(statsLieux: StatsLieu[], nbDernieresSecondes: number) {
        const stats = statsLieux.map(statsLieu => {
            const maxAppointments = Math.max(...statsLieu.stats.map((s: StatLieu) => s.appointment_count || 0));
            const maxChronodoseAppointments = Math.max(...statsLieu.stats.map(s => s.chronodose_appointment_count || 0));
            const statsLieuAggregees = statsLieu.stats.reduce((result, stat, index, stats) => {
                if(index !== 0) {
                    let duree = getTime(parseISO(stat.date)) - getTime(parseISO(stats[index-1].date));
                    result.dureesParRdv.push({
                        duree,
                        appointments: stats[index-1].appointment_count || 0,
                        chronodoseAppointments: stats[index-1].chronodose_appointment_count || 0
                    });
                    result.dureeTotale += duree;
                }
                return result;
            }, { dureeTotale: 0, dureesParRdv: [] as DureeParRdv[] });

            const avgStandard = sum(statsLieuAggregees.dureesParRdv.map(dpa => dpa.duree * dpa.appointments)) / statsLieuAggregees.dureeTotale;
            const avgChronodose = sum(statsLieuAggregees.dureesParRdv.map(dpa => dpa.duree * dpa.chronodoseAppointments)) / statsLieuAggregees.dureeTotale;

            const varianceStandard = sum(statsLieuAggregees.dureesParRdv.map(dpa => dpa.duree * dpa.appointments * dpa.appointments)) - (avgStandard * avgStandard)
            const varianceChronodose = sum(statsLieuAggregees.dureesParRdv.map(dpa => dpa.duree * dpa.chronodoseAppointments * dpa.chronodoseAppointments)) - (avgChronodose * avgChronodose)

            const statsLieuSurDernieresSecondes = Chronodoses.filtrerStatsLieuSurDernieresSecondes(statsLieu.stats, nbDernieresSecondes);
            const coefsDirecteur = Chronodoses.calculerCoefficientsDirecteursDesDurees(statsLieuSurDernieresSecondes);
            const moyenneCoefsDirecteursStandardParMinute = coefsDirecteur?
                abs(sum(coefsDirecteur.map(cd => cd.coefDirecteurStandard*cd.duree))*1000*60/sum(coefsDirecteur.map(cd => cd.duree)))
                :undefined;
            const moyenneCoefsDirecteursChronodoseParMinute = coefsDirecteur?
                abs(sum(coefsDirecteur.map(cd => cd.coefDirecteurChronodose*cd.duree))*1000*60/sum(coefsDirecteur.map(cd => cd.duree)))
                :undefined;

            const appointmentStats = {
                statsLieu, coefsDirecteur,
                moyenneCoefsDirecteursStandardParMinute, moyenneCoefsDirecteursChronodoseParMinute,
                statsLieuSurDernieresSecondes,
                // maxAppointments, avgStandard, varianceStandard,
                // maxChronodoseAppointments, avgChronodose, varianceChronodose
            };

            return appointmentStats;
        });

        return stats;
    }

    async trouverCentresEligiblesChronodose(): Promise<LieuCandidatAuxChronodoses[]> {
        const statsLieux = await Historique.INSTANCE.statsLieux();

        const stats = this.calculerStatsLieuxRecentes(statsLieux, 60*60);

        const goodChronodoseCandidates = stats
            .filter(s =>
                s.moyenneCoefsDirecteursChronodoseParMinute !== undefined
                // Au moins une moyenne de 1 créneau toutes les 10min qui bouge sur la durée
                && s.moyenneCoefsDirecteursChronodoseParMinute >= 0.1
                && s.statsLieuSurDernieresSecondes
                && s.statsLieuSurDernieresSecondes.length > 4
                && (s.statsLieuSurDernieresSecondes[s.statsLieuSurDernieresSecondes.length-1].chronodose_appointment_count || 0) > 2
                && Date.now() - getTime(parseISO(s.statsLieuSurDernieresSecondes[s.statsLieuSurDernieresSecondes.length-1].date)) <= 1000*60*15
            )
            .sort((s1,s2) => s2.moyenneCoefsDirecteursChronodoseParMinute! - s1.moyenneCoefsDirecteursChronodoseParMinute!);

        return goodChronodoseCandidates.map(candidate => ({
            lieu: candidate.statsLieu.lieu,
            statsLieuSurDernieresSecondes: candidate.statsLieuSurDernieresSecondes!,
            coefsDirecteur: candidate.coefsDirecteur!,
            moyenneCoefsDirecteursStandardParMinute: candidate.moyenneCoefsDirecteursStandardParMinute!,
            moyenneCoefsDirecteursChronodoseParMinute: candidate.moyenneCoefsDirecteursChronodoseParMinute!,
        }));
    }

    private static calculerCoefficientsDirecteursDesDurees(stats: StatLieu[]|undefined) {
        if(!stats || stats.length < 2) {
            return undefined;
        }

        const coefsDirecteurs = stats.map((s, index, stats) => {
            if(index === 0){
                return undefined;
            }
            const duree = getTime(parseISO(stats[index].date)) - getTime(parseISO(stats[index-1].date));
            const coefDirecteurStandard =
                Math.abs((stats[index].appointment_count || 0) - (stats[index-1].appointment_count || 0))
                / duree;
            const coefDirecteurChronodose =
                Math.abs((stats[index].chronodose_appointment_count || 0) - (stats[index-1].chronodose_appointment_count || 0))
                / duree;

            return { coefDirecteurStandard, coefDirecteurChronodose, duree };
        }).filter((_,idx) => idx > 0);

        return coefsDirecteurs as {coefDirecteurStandard: number, coefDirecteurChronodose: number, duree: number}[];
    }

    private static filtrerStatsLieuSurDernieresSecondes(stats: StatLieu[], nbSecondes: number) {
        const derniereStat = stats[stats.length-1];
        if(!derniereStat){
            return undefined;
        }

        const tsDerniereStat = getTime(parseISO(derniereStat.date));
        return stats.filter(s => {
            return tsDerniereStat - getTime(parseISO(s.date)) <= 1000*nbSecondes;
        })
    }
}
