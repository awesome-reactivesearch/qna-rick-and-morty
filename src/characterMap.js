import rick from "./characters/rick.png";
import morty from "./characters/morty.png";
import jerry from "./characters/jerry.png";
import summer from "./characters/summer.png";
import beth from "./characters/beth.png";
import alien from "./characters/alien.png";
import pickleRick from "./characters/pickle-rick.png";
import mrGoldenFold from "./characters/mr-goldenfold.png";
import superNova from "./characters/supernova.png";

const characterMap = {
  Rick: rick,
  Morty: morty,
  Jerry: jerry,
  Summer: summer,
  Beth: beth,
  "All Ricks": rick,
  "Cop Morty": morty,
  "Pickle Rick": pickleRick,
  "Mr. Goldenfold": mrGoldenFold,
  Supernova: superNova,
};

const getCharacterIcon = (character) => characterMap[character] || alien;

export default getCharacterIcon;
