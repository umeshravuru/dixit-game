// Public-domain dreamlike artworks from Wikimedia Commons.
// These are surreal/symbolist paintings that work well for Dixit-style clues.
// All URLs are stable thumbnail endpoints.

export interface Card {
  id: number;
  url: string;
  title: string;
}

const w = (filename: string, width = 600) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${filename}/${width}px-${filename.split('/').pop()}`;

// Each entry: [path-to-file, title]. Path format: "a/bc/Filename.jpg"
const sources: [string, string][] = [
  ['e/eb/Henri_Rousseau_-_The_Dream.jpg', 'The Dream'],
  ['c/c7/Henri_Rousseau_-_Tiger_in_a_Tropical_Storm.jpg', 'Tiger in a Tropical Storm'],
  ['a/a4/Henri_Rousseau_-_The_Sleeping_Gypsy.jpg', 'The Sleeping Gypsy'],
  ['f/f1/Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', 'Starry Night'],
  ['e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg', 'Wheatfield with Crows'],
  ['9/94/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg', 'Wanderer above the Sea of Fog'],
  ['7/7d/Caspar_David_Friedrich_-_Two_Men_Contemplating_the_Moon.jpg', 'Two Men Contemplating the Moon'],
  ['a/aa/Caspar_David_Friedrich_-_The_Sea_of_Ice.jpg', 'The Sea of Ice'],
  ['9/9f/Arnold_Böcklin_-_Die_Toteninsel_III_(Alte_Nationalgalerie,_Berlin).jpg', 'Isle of the Dead'],
  ['4/41/John_William_Waterhouse_-_The_Lady_of_Shalott.jpg', 'The Lady of Shalott'],
  ['1/1c/John_William_Waterhouse_-_Hylas_and_the_Nymphs.jpg', 'Hylas and the Nymphs'],
  ['9/95/Edmund_Dulac_-_Princess_and_pea.jpg', 'Princess and the Pea'],
  ['3/36/Edmund_Dulac_-_Sindbad_the_Sailor_-_The_old_man_of_the_sea.jpg', 'Old Man of the Sea'],
  ['e/e8/Gustave_Doré_-_Dante_Alighieri_-_Inferno_-_Plate_8_(Canto_III_-_Charon).jpg', 'Charon Crosses the Styx'],
  ['c/c2/John_Atkinson_Grimshaw_-_Moonlight_on_the_Thames.jpg', 'Moonlight on the Thames'],
  ['6/6c/Maxfield_Parrish_-_Daybreak_(1922).jpg', 'Daybreak'],
  ['d/d1/Hieronymus_Bosch_-_The_Garden_of_Earthly_Delights_-_The_exterior_(shutters).jpg', 'Garden of Earthly Delights'],
  ['c/c0/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_(Vienna)_-_Google_Art_Project.jpg', 'Tower of Babel'],
  ['7/77/Pieter_Bruegel_the_Elder_-_Hunters_in_the_Snow_(Winter)_-_Google_Art_Project.jpg', 'Hunters in the Snow'],
  ['9/9c/William_Blake_-_The_Ancient_of_Days.jpg', 'The Ancient of Days'],
  ['7/7b/William_Blake_-_Newton_-_WGA02216.jpg', 'Newton'],
  ['6/6c/Odilon_Redon_-_The_Cyclops.jpg', 'The Cyclops'],
  ['7/79/Gustave_Moreau_-_Oedipus_and_the_Sphinx.jpg', 'Oedipus and the Sphinx'],
  ['e/e2/Ivan_Aivazovsky_-_The_Ninth_Wave_-_Google_Art_Project.jpg', 'The Ninth Wave'],
  ['8/8b/Albert_Bierstadt_-_Among_the_Sierra_Nevada,_California_-_Google_Art_Project.jpg', 'Among the Sierra Nevada'],
  ['6/65/Albert_Bierstadt_-_Looking_Down_Yosemite_Valley,_California.jpg', 'Looking Down Yosemite Valley'],
  ['e/ed/Thomas_Cole_-_The_Course_of_Empire_-_Desolation_-_1836.jpg', 'The Course of Empire: Desolation'],
  ['7/73/Thomas_Cole_-_The_Voyage_of_Life_Childhood,_1842_(National_Gallery_of_Art).jpg', 'The Voyage of Life: Childhood'],
  ['8/87/Joseph_Mallord_William_Turner_-_The_Slave_Ship.jpg', 'The Slave Ship'],
  ['c/c3/Joseph_Mallord_William_Turner_-_The_Fighting_Téméraire_tugged_to_her_last_berth_to_be_broken.jpg', 'The Fighting Téméraire'],
  ['9/9c/Henry_Fuseli_-_The_Nightmare.jpg', 'The Nightmare'],
  ['3/3f/Francisco_de_Goya,_Saturno_devorando_a_su_hijo_(1819-1823).jpg', 'Saturn Devouring His Son'],
  ['8/82/Francisco_de_Goya_y_Lucientes_-_The_sleep_of_reason_produces_monsters_(No._43),_from_Los_Caprichos_-_Google_Art_Project.jpg', 'Sleep of Reason'],
  ['7/74/Hokusai-fuji-koryuu.png', 'Dragon and Mount Fuji'],
  ['a/a5/Tsukioka_Yoshitoshi_-_Lunacy_Unrolling_letters.jpg', 'Unrolling Letters'],
  ['b/b6/Edvard_Munch_-_The_Scream_-_Google_Art_Project.jpg', 'The Scream'],
  ['c/c5/Edvard_Munch_-_Melancholy_(1894-96).jpg', 'Melancholy'],
  ['1/11/Gustav_Klimt_-_The_Kiss_-_Google_Art_Project.jpg', 'The Kiss'],
  ['1/19/Marc_Chagall,_1911,_I_and_the_Village,_oil_on_canvas,_192.1_x_151.4_cm,_Museum_of_Modern_Art,_New_York..jpg', 'I and the Village'],
  ['9/9c/René_Magritte_-_Time_Transfixed_-_1938.jpg', 'Time Transfixed'],
  ['7/77/Paul_Klee_-_Senecio_-_Google_Art_Project.jpg', 'Senecio'],
];

export const CARDS: Card[] = sources.map(([path, title], i) => {
  const filename = path.split('/').pop()!;
  return {
    id: i,
    url: `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/600px-${filename}`,
    title,
  };
});

export const CARD_COUNT = CARDS.length;
