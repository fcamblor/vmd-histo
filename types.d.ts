
type ISODateTime = string;

type Departement = {
    code_departement: string;
    code_region: number;
    nom_departement: string;
    nom_region: string;
};


type LieuxParDepartement = {
    version: number;
    last_updated: ISODateTime;
    centres_indisponibles: Lieu[];
    centres_disponibles: Lieu[];
};

type LieuxParDepartementAvecDepartement = LieuxParDepartement & { departement: Departement };

type TypePlateforme = "Doctolib"|"Maiia"|"Ordoclic"|"Keldoc"|"Pandalab"|"Mapharma";

type TypeLieu = 'vaccination-center'|'drugstore'|'general-practitioner';
type BusinessHours = Record<WeekDay,string>;
type VaccineType = string;
type AppointmentSchedule = {
    name: string;
    from: ISODateTime;
    to: ISODateTime;
    total: number;
};
type Lieu = {
    appointment_count: number;
    departement: CodeDepartement;
    location: { longitude: number, latitude: number, city: string, cp: string },
    nom: string;
    url: string;
    internal_id: string;
    appointment_by_phone_only: boolean;
    appointment_schedules: AppointmentSchedule[]|undefined;
    plateforme: TypePlateforme;
    prochain_rdv: ISODateString|null;
    metadata: {
        address: string;
        phone_number: string|undefined;
        business_hours: BusinessHours|undefined
    },
    type: TypeLieu;
    vaccine_type: VaccineType
};

type StatLieu = {
    date: ISODateTime;

    prochain_rdv: ISODateString|null;
    appointment_count: number|undefined;
    chronodose_appointment_count: number|undefined;
};

type LieuSansStatsRdv = Omit<Lieu, "appointment_count"|"appointment_schedules"|"prochain_rdv">

type StatsLieu = {
    lieu: LieuSansStatsRdv;
    stats: StatLieu[];
};

type LieuCandidatAuxChronodoses = {
    lieu: LieuSansStatsRdv;
    statsLieuSurDernieresSecondes: StatLieu[];
    coefsDirecteur: {
        coefDirecteurStandard: number;
        coefDirecteurChronodose: number;
        duree: number;
    }[];
    moyenneCoefsDirecteursStandardParMinute: number;
    moyenneCoefsDirecteursChronodoseParMinute: number;
};
