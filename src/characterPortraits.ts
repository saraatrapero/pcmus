import tioGilImg from './assets/images/tio_gil_portrait_1788735995160.jpg';
import marquesImg from './assets/images/marques_banker_portrait_1788736020860.jpg';
import isidoroImg from './assets/images/isidoro_leader_portrait_1788736035172.jpg';
import mateoImg from './assets/images/mateo_businessman_portrait_1788736049313.jpg';
import normaImg from './assets/images/norma_vedette_portrait_1788736061397.jpg';
import camareroNavarraImg from './assets/images/camarero_navarra_1788745152397.jpg';
import senoritaRosaImg from './assets/images/senorita_rosa_1788745210719.jpg';
import donJulianImg from './assets/images/don_julian_1788745482667.jpg';
import tavernBgImg from './assets/images/pcmus_tavern_bg_1788744661566.jpg';
import tabernaNocheImg from './assets/images/taberna_noche_1788745497578.jpg';
import chiquitoImg from './assets/images/chiquito_cameo_1788744733153.jpg';
import panDePuebloImg from './assets/images/pan_de_pueblo_1788745469896.jpg';

export {
  tavernBgImg,
  tabernaNocheImg,
  chiquitoImg,
  camareroNavarraImg,
  donJulianImg,
  panDePuebloImg,
};

export const CHARACTER_CARTOON_PORTRAITS: Record<string, string> = {
  tio_gil: tioGilImg,
  el_marques: marquesImg,
  el_isidoro: isidoroImg,
  tio_mateo: mateoImg,
  dona_norma: normaImg,
  camarero_navarra: camareroNavarraImg,
  senorita_rosa: senoritaRosaImg,
  don_julian: donJulianImg,
};

export function getCharacterPortraitUrl(id: string): string | null {
  return CHARACTER_CARTOON_PORTRAITS[id] || null;
}
