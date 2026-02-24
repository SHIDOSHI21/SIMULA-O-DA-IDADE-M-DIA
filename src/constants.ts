import { Lineage } from "./types";

export const LINEAGES: (Lineage & { icon: string; kingdom: string; initialCurrency: { dinheiros: number; sous: number; libras: number } })[] = [
  {
    id: 1,
    name: "Arthur/Isabel de Windsor (Filho/a do Rei)",
    icon: "👑",
    kingdom: "Inglaterra",
    description: "Nobreza Real",
    initialAttributes: { health: 80, strength: 40, intelligence: 70, wealth: 200, honor: 100 },
    initialCurrency: { dinheiros: 0, sous: 0, libras: 200 },
    linkedNPCs: [
      { id: "henrique", name: "Rei Henrique III", role: "Pai", status: "Vivo", relationship: "Pai", affinity: 80 },
      { id: "eduardo", name: "Príncipe Eduardo", role: "Irmão", status: "Vivo", relationship: "Irmão", affinity: 60 },
      { id: "eleanor", name: "Lady Eleanor", role: "Dama de companhia", status: "Vivo", relationship: "Aliada", affinity: 90 }
    ],
    initialChallenge: "Você acorda em seu quarto de castelo, cortinas de veludo vermelho. Seu servo Tomás entra ajoelhado: 'Meu príncipe/princesa — o Rei quer vê-lo(a) na sala do trono. Há assunto grave a discutir...'"
  },
  {
    id: 2,
    name: "Jean/Marie Dubois (Plebeu Agricultor)",
    icon: "🌾",
    kingdom: "França",
    description: "Agricultor",
    initialAttributes: { health: 70, strength: 65, intelligence: 35, wealth: 15, honor: 25 },
    initialCurrency: { dinheiros: 50, sous: 10, libras: 0 },
    linkedNPCs: [
      { id: "pierre", name: "Pierre Dubois", role: "Pai", status: "Vivo", relationship: "Pai", affinity: 85 },
      { id: "sophie", name: "Sophie Dubois", role: "Mãe", status: "Vivo", relationship: "Mãe", affinity: 95 },
      { id: "lucas", name: "Lucas", role: "Amigo da vila", status: "Vivo", relationship: "Amigo", affinity: 70 }
    ],
    initialChallenge: "Você acorda no palheiro da sua casa, o cheiro de terra no ar. Sua mãe Sophie chama: 'Jean/Marie! Acorde já — temos que plantar trigo antes que o sol esquente demais!'"
  },
  {
    id: 3,
    name: "Klaus/Lena Weber (Sem Morada)",
    icon: "🛤️",
    kingdom: "Sacro Império Germânico",
    description: "Mendigo",
    initialAttributes: { health: 60, strength: 55, intelligence: 50, wealth: 5, honor: 10 },
    initialCurrency: { dinheiros: 10, sous: 0, libras: 0 },
    linkedNPCs: [
      { id: "gustav", name: "Gustav", role: "Amigo sem-teto", status: "Vivo", relationship: "Amigo", affinity: 80 },
      { id: "brigida", name: "Brigida", role: "Mulher generosa", status: "Vivo", relationship: "Benfeitora", affinity: 50 },
      { id: "heinrich", name: "Guardião Heinrich", role: "Guarda", status: "Vivo", relationship: "Inimigo", affinity: 10 }
    ],
    initialChallenge: "Você acorda em um beco escuro de Berlim, com frio nos ossos. Gustav chega correndo: 'Cuidado! O guardião Heinrich está rondando os becos — vamos nos esconder na floresta!'"
  },
  {
    id: 4,
    name: "Marco/Rosa Rossi (Filho/a de Bandido)",
    icon: "⚔️",
    kingdom: "Reino dos Papados",
    description: "Bandido",
    initialAttributes: { health: 75, strength: 70, intelligence: 45, wealth: 35, honor: 5 },
    initialCurrency: { dinheiros: 100, sous: 20, libras: 0 },
    linkedNPCs: [
      { id: "giovanni", name: "Giovanni Rossi", role: "Chefe do bando", status: "Vivo", relationship: "Pai", affinity: 75 },
      { id: "carla", name: "Carla", role: "Parceira do bando", status: "Vivo", relationship: "Parceira", affinity: 85 },
      { id: "antonio", name: "Guardião Antonio", role: "Guarda", status: "Vivo", relationship: "Inimigo", affinity: 0 }
    ],
    initialChallenge: "Você está acampado na floresta perto de Roma. Seu pai Giovanni bate na sua tenda: 'Hoje temos uma boa oportunidade — uma carreta de mercadorias do bispo passa por aqui às três!'"
  },
  {
    id: 5,
    name: "Fergus/Morag MacLeod (Mongês/a da Abadia)",
    icon: "✝️",
    kingdom: "Escócia",
    description: "Religioso",
    initialAttributes: { health: 65, strength: 40, intelligence: 80, wealth: 20, honor: 75 },
    initialCurrency: { dinheiros: 30, sous: 5, libras: 0 },
    linkedNPCs: [
      { id: "columba", name: "Abade Columba", role: "Líder da abadía", status: "Vivo", relationship: "Mestre", affinity: 80 },
      { id: "duncan", name: "Irmão Duncan", role: "Amigo", status: "Vivo", relationship: "Amigo", affinity: 75 },
      { id: "catriona", name: "Irmã Catriona", role: "Colega", status: "Vivo", relationship: "Colega", affinity: 70 }
    ],
    initialChallenge: "Você acorda na cela da abadía, ouvindo os sinos tocar. Abade Columba procura por você: 'Fergus/Morag — temos um pergaminho antigo para decifrar. Pode ser a chave para curar a febre que aflige nossa vila...'"
  }
];
