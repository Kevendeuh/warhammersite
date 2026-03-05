const { v4: uuidv4 } = require('uuid');
const { saveCollection } = require('./db');

const figurines = [
    {
        id: uuidv4(),
        nom: "Apothicaire Bienveillant",
        description_lore: "Gardienne de la Narthecium rose, l'Apothicaire Space Maid soigne ses frères d'armes avec une douceur terrifiante. Son sourire est la dernière chose que voient les hérétiques.",
        prix_credits: 2800,
        image_url: "/images/apoticary.png",
        stock: 15
    },
    {
        id: uuidv4(),
        nom: "Terminator Mignon Supreme",
        description_lore: "Revêtue d'une armure Tactique Terminator customisée en rose, elle distribue des câlins... et des obus de Cyclone. Ses nœuds résistent au vide spatial.",
        prix_credits: 4200,
        image_url: "/images/terminator.jpg",
        stock: 8
    },
    {
        id: uuidv4(),
        nom: "Chevaucheur de Moto de Service",
        description_lore: "Sur sa moto repeinte en rose bonbon, cette Space Maid patrouille les ruches à grande vitesse. Son tablier flotte dans le vent de la guerre.",
        prix_credits: 3500,
        image_url: "/images/bike.png",
        stock: 12
    },
    {
        id: uuidv4(),
        nom: "Diaporama de Gloire Impériale",
        description_lore: "Un chef-d'œuvre de propagande bienveillante. Cette figurine projette des images de l'Empereur en tenue de maid. Classé confidentiel par l'Inquisition.",
        prix_credits: 1900,
        image_url: "/images/diaporama.png",
        stock: 20
    },
    {
        id: uuidv4(),
        nom: "Drop Pod Restaurant",
        description_lore: "Le Drop Pod le plus redouté du secteur, car il délivre non pas des Space Marines... mais une cuisine de terrain cinq étoiles. L'ennemi capitule de faim.",
        prix_credits: 5500,
        image_url: "/images/dropPodRestaurant.png",
        stock: 5
    },
    {
        id: uuidv4(),
        nom: "Chapelain de la Très Sainte Douceur",
        description_lore: "Le Chapelain brandit son sceptre crânien et récite les litanies de la délicatesse. Ses sermons durent exactement le temps d'un thé chaud.",
        prix_credits: 3100,
        image_url: "/images/chaplain.png",
        stock: 10
    },
    {
        id: uuidv4(),
        nom: "Tacticus Prima",
        description_lore: "Maîtresse de la stratégie en tablier de combat, Tacticus Prima a planifié la reconquête de seize systèmes stellaires entre deux fournées de cookies.",
        prix_credits: 2600,
        image_url: "/images/tacticus.png",
        stock: 18
    },
    {
        id: uuidv4(),
        nom: "Primarch Nekona l'Éternelle",
        description_lore: "Descendante divine, Nekona mène ses légions avec une grâce féline. On dit que même le Chaos recule devant ses oreilles de chat et son regard doré.",
        prix_credits: 9800,
        image_url: "/images/primarchNekona.png",
        stock: 3
    },
    {
        id: uuidv4(),
        nom: "Hulkbuster Cuirassé de Service",
        description_lore: "Une armure colossale de la Manufacture Impériale, repeinte en rose par des mains inconnues. Le pilote serait une Space Maid de la 1ère Compagnie. Non confirmé.",
        prix_credits: 7700,
        image_url: "/images/hulkbuster.png",
        stock: 6
    }
];

console.log('🌸 Initialisation des archives de l\'Adeptus Figurinae...');
saveCollection('figurines', figurines);
saveCollection('users', []);
saveCollection('orders', []);
console.log(`✅ ${figurines.length} figurines sauvegardées dans les archives impériales.`);
console.log('   Que l\'Empereur protège votre collection !');
