import { Colors } from './theme';

export const INCONTOURNABLES = [
  {
    id: '1',
    name: 'Mont Hardi ÉTÉ',
    style: 'Blanche houblonnée',
    bgColor: Colors.jaune,
    image: require('../assets/biere1.png'),
  },
  {
    id: '2',
    name: 'Sa Majesté Sour',
    style: 'Sour',
    bgColor: Colors.bleu,
    image: require('../assets/biere2.png'),
  },
  {
    id: '3',
    name: 'Gueule de joie sans alcool',
    style: 'Sans alcool',
    bgColor: Colors.rose,
    image: require('../assets/biere3.png'),
  },
  {
    id: '4',
    name: 'Lichtenhainer Sour',
    style: 'Sour fumée',
    bgColor: Colors.orange,
    image: require('../assets/biere4.png'),
  },
];

export const SUGGESTIONS = [
  {
    id: '1',
    name: 'Sa Majesté Sour',
    abv: "6 % d'alcool",
    description: 'Bière aromatisée au concombre et menthe',
    bgColor: Colors.bleu,
    image: require('../assets/biere2.png'),
  },
  {
    id: '2',
    name: 'Mont Hardi ÉTÉ',
    abv: "5,5 % d'alcool",
    description: 'la Hopfenweisse, une blanche allemande houblonnée !',
    bgColor: Colors.jaune,
    image: require('../assets/biere1.png'),
  },
  {
    id: '3',
    name: 'Gueule de joie sans alcool',
    abv: "0,3% d'alcool",
    description: 'Bière sans alcool aromatisée aux fleurs',
    bgColor: Colors.rose,
    image: require('../assets/biere3.png'),
  },
];

export const CATEGORIES = [
  {
    id: '1',
    label: 'Houblonné',
    bgColor: Colors.jaune,
    textColor: Colors.noir,
    image: require('../assets/houblone.png'),
  },
  {
    id: '2',
    label: 'Végétal',
    bgColor: Colors.vert,
    textColor: Colors.blanc,
    image: require('../assets/vegetal.png'),
  },
  {
    id: '3',
    label: 'Floral',
    bgColor: Colors.rose,
    textColor: Colors.noir,
    image: require('../assets/floral.png'),
  },
  {
    id: '4',
    label: 'Fruité',
    bgColor: Colors.bleu,
    textColor: Colors.blanc,
    image: require('../assets/fruite.png'),
  },
  {
    id: '5',
    label: 'Torréfié',
    bgColor: Colors.orange,
    textColor: Colors.noir,
    image: require('../assets/torrefie.png'),
  },
  {
    id: '6',
    label: 'Épicé',
    bgColor: Colors.rouge,
    textColor: Colors.blanc,
    image: require('../assets/epice.png'),
  },
];
