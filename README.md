# Pré-requis

Node 14 ou supérieur.

# Installation

Installer les dépendances : `npm ci`

# Exécution

Une fois les dépendances installées, lancer la commande suivante : `npx ts-node src/commands/historiser-centres.ts `

# Mode de fonctionnement

Un CRON se lancera qui, régulièrement (toutes les 2 minutes), récupère l'état des créneaux de chaque
centre, et les historise si elles ont évolué.


Les fichiers suivants sont produits par le CRON actuel :
- `resultats/departements/<codeDepartement>.json` : il s'agit des fichiers centre par département correspondant 
  stricto senso à ce qu'on a sur `https://vitemadose.gitlab.io/vitemadose/<codeDepartement>.json`
- `resultats/departements/historique/<codeDepartement>/<ISODateTime>.json`: "snapshot" de l'état des 
  départements tels qu'ils étaient à une date donnée dans le passé. Le format de fichiers est le même
  que celui des fichiers departement.
- `resultats/lieux/<internalId>.json`: historique des modifications appliqués à un centre.    
  Il est important de noter que si le nombre de chronodoses et de créneaux totaux ne change pas
  entre 2 scraps, **aucune donnée n'est historisée**.
  
<details>
<summary>Ici, un exemple de fichier d'historique de centre</summary>
<p>

```json
{
  "lieu": {
    "internal_id": "maiia5ffdf3319021595c9eb87497",
    "departement": "93",
    "location": {
      "longitude": 2.54251,
      "latitude": 48.926025,
      "city": "Livry-Gargan",
      "cp": "93190"
    },
    "nom": "Centre de recours à la vaccination de livry gargan",
    "url": "https://www.maiia.com/centre-de-vaccination/93190-livry-gargan/centre-de-recours-a-la-vaccination-de-livry-gargan?centerid=5ffdf3319021595c9eb87497",
    "appointment_by_phone_only": false,
    "plateforme": "Maiia",
    "metadata": {
      "address": "2-16 avenue Ferrer (Gymnase Jacob) 93190 Livry-Gargan",
      "business_hours": {
        "Lundi": "08:45-17:00",
        "Mardi": "08:45-17:00",
        "Mercredi": "08:45-17:00",
        "Jeudi": "08:45-17:00",
        "Vendredi": "08:45-17:00",
        "Samedi": "08:45-17:00",
        "Dimanche": "08:45-17:00"
      },
      "phone_number": "+33800093190"
    },
    "type": "vaccination-center",
    "vaccine_type": [
      "ARNm",
      "Pfizer-BioNTech"
    ]
  },
  "stats": [
    {
      "date": "2021-05-17T00:14:28.372545+02:00",
      "prochain_rdv": "2021-05-17T08:55:00+00:00",
      "appointment_count": 600,
      "chronodose_appointment_count": 3
    },
    {
      "date": "2021-05-17T06:48:07.287965+02:00",
      "prochain_rdv": "2021-05-17T11:55:00+00:00",
      "appointment_count": 601,
      "chronodose_appointment_count": 1
    },
    {
      "date": "2021-05-17T06:58:43.004695+02:00",
      "prochain_rdv": "2021-05-18T07:20:00+00:00",
      "appointment_count": 600,
      "chronodose_appointment_count": 0
    },
    {
      "date": "2021-05-17T08:34:04.855115+02:00",
      "prochain_rdv": "2021-05-18T06:30:00+00:00",
      "appointment_count": 603,
      "chronodose_appointment_count": 3
    },
    {
      "date": "2021-05-17T08:40:07.951313+02:00",
      "prochain_rdv": "2021-05-17T10:45:00+00:00",
      "appointment_count": 607,
      "chronodose_appointment_count": 8
    },
    {
      "date": "2021-05-17T08:44:38.602777+02:00",
      "prochain_rdv": "2021-05-18T06:45:00+00:00",
      "appointment_count": 600,
      "chronodose_appointment_count": 0
    },
    {
      "date": "2021-05-17T08:59:52.846679+02:00",
      "prochain_rdv": "2021-05-17T16:55:00+00:00",
      "appointment_count": 601,
      "chronodose_appointment_count": 2
    },
    {
      "date": "2021-05-17T09:10:58.965135+02:00",
      "prochain_rdv": "2021-05-18T06:45:00+00:00",
      "appointment_count": 600,
      "chronodose_appointment_count": 1
    },
    {
      "date": "2021-05-17T09:14:48.632057+02:00",
      "prochain_rdv": "2021-05-18T06:45:00+00:00",
      "appointment_count": 601,
      "chronodose_appointment_count": 2
    },
    {
      "date": "2021-05-17T09:19:53.605250+02:00",
      "prochain_rdv": "2021-05-17T11:25:00+00:00",
      "appointment_count": 600,
      "chronodose_appointment_count": 2
    },
    {
      "date": "2021-05-17T09:54:50.360135+02:00",
      "prochain_rdv": "2021-05-17T12:45:00+00:00",
      "appointment_count": 601,
      "chronodose_appointment_count": 4
    },
    {
      "date": "2021-05-17T09:58:38.410175+02:00",
      "prochain_rdv": "2021-05-17T12:45:00+00:00",
      "appointment_count": 600,
      "chronodose_appointment_count": 4
    },
    {
      "date": "2021-05-17T11:03:55.726722+02:00",
      "prochain_rdv": "2021-05-18T07:25:00+00:00",
      "appointment_count": 700,
      "chronodose_appointment_count": 8
    },
    {
      "date": "2021-05-17T11:09:59.089161+02:00",
      "prochain_rdv": "2021-05-18T08:25:00+00:00",
      "appointment_count": 708,
      "chronodose_appointment_count": 16
    },
    {
      "date": "2021-05-17T11:14:00.349680+02:00",
      "prochain_rdv": "2021-05-17T17:25:00+00:00",
      "appointment_count": 701,
      "chronodose_appointment_count": 3
    },
    {
      "date": "2021-05-17T11:19:33.708204+02:00",
      "prochain_rdv": "2021-05-18T09:00:00+00:00",
      "appointment_count": 700,
      "chronodose_appointment_count": 1
    },
    {
      "date": "2021-05-17T11:56:42.704491+02:00",
      "prochain_rdv": "2021-05-18T09:30:00+00:00",
      "appointment_count": 701,
      "chronodose_appointment_count": 3
    },
    {
      "date": "2021-05-17T12:01:33.620201+02:00",
      "prochain_rdv": "2021-05-18T10:00:00+00:00",
      "appointment_count": 700,
      "chronodose_appointment_count": 0
    }
  ]
}
```

</p>
</details>

A noter, une exécution pendant 12h du script a produit :  
- Environ **4Mo** de données "centre"
- Environ **600Mo** de données "département"
