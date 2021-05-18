import fetch from "node-fetch";

const vmdRootUrl = 'https://vitemadose.gitlab.io/vitemadose'
// const vmdRootUrl = 'https://raw.githubusercontent.com/CovidTrackerFr/vitemadose/data-auto/data/output'

export class ViteMaDose {
    public static readonly INSTANCE = new ViteMaDose();
    private constructor() {
    }

    async lieuxParDepartements() {
        const depts: Departement[] = await fetch(`${vmdRootUrl}/departements.json`)
            .then(resp => resp.json());

        const lieux = await Promise.all(depts.map(dept => {
                return fetch(`${vmdRootUrl}/${dept.code_departement}.json`)
                    .then(resp => resp.json())
                    .then(data => ({...data, departement: dept}))
            })).then(([...lieux]: LieuxParDepartementAvecDepartement[]) => lieux as LieuxParDepartementAvecDepartement[]);

        return lieux;
    }
}
