import { Producto } from '../types/productos.types';

export interface BarcodeProductoInfo {
  sku: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  precioCompra: number;
  precioVenta: number;
  stockSugerido: number;
  stockMinimoSugerido: number;
  marca?: string;
  formato?: string;
}

export type BarcodeLookupResult =
  | {
      status: 'existente_en_catalogo';
      producto: Producto;
      origen: 'catalogo_local';
    }
  | {
      status: 'encontrado';
      datos: BarcodeProductoInfo;
      origen: 'base_peru' | 'open_food_facts';
    }
  | {
      status: 'desconocido';
      datos: {
        sku: string;
        nombre: string;
        categoria: string;
        unidadMedida: string;
        precioCompra: number;
        precioVenta: number;
        stockSugerido: number;
        stockMinimoSugerido: number;
      };
      origen: 'nuevo';
    };

/**
 * Base de datos enriquecida de códigos de barras (EAN-13 y SKUs) de productos
 * de alta rotación en bodegas, minimarkets y abarrotes del Perú.
 */
export const CATALOGO_BARRAS_PERU: Record<string, BarcodeProductoInfo> = {
  // Lácteos y Desayunos
  '7750106001234': {
    sku: '7750106001234',
    nombre: 'Leche Evaporada Gloria Entera Azul 400g',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'LATA',
    precioCompra: 3.6,
    precioVenta: 4.3,
    stockSugerido: 48,
    stockMinimoSugerido: 12,
    marca: 'Gloria',
    formato: 'Lata 400g',
  },
  '7750106002345': {
    sku: '7750106002345',
    nombre: 'Leche Evaporada Gloria Light Roja 400g',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'LATA',
    precioCompra: 3.7,
    precioVenta: 4.5,
    stockSugerido: 24,
    stockMinimoSugerido: 8,
    marca: 'Gloria',
    formato: 'Lata 400g',
  },
  '7750106003456': {
    sku: '7750106003456',
    nombre: 'Yogurt Gloria Fresa Parcialmente Descremado 1L',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'BOTELLA',
    precioCompra: 5.6,
    precioVenta: 7.2,
    stockSugerido: 18,
    stockMinimoSugerido: 6,
    marca: 'Gloria',
    formato: 'Botella 1 Litro',
  },
  '7750106017171': {
    sku: '7750106017171',
    nombre: 'Mantequilla Gloria con Sal Barra 200g',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'UNIDAD',
    precioCompra: 6.5,
    precioVenta: 8.2,
    stockSugerido: 15,
    stockMinimoSugerido: 5,
    marca: 'Gloria',
    formato: 'Barra 200g',
  },
  '7750106018181': {
    sku: '7750106018181',
    nombre: 'Queso Edam Bonlé Rebanado 250g',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'PAQUETE',
    precioCompra: 9.5,
    precioVenta: 12.8,
    stockSugerido: 12,
    stockMinimoSugerido: 4,
    marca: 'Bonlé',
    formato: 'Empaque 250g',
  },
  '7750186022222': {
    sku: '7750186022222',
    nombre: 'Avena 3 Ositos Tradicional Hojuelas 300g',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'BOLSA',
    precioCompra: 2.4,
    precioVenta: 3.3,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: '3 Ositos',
    formato: 'Bolsa 300g',
  },
  '7750005001234': {
    sku: '7750005001234',
    nombre: 'Café Instantáneo Nescafé Tradición 50g',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'UNIDAD',
    precioCompra: 4.8,
    precioVenta: 6.2,
    stockSugerido: 20,
    stockMinimoSugerido: 6,
    marca: 'Nescafé',
    formato: 'Frasco 50g',
  },
  '7750005009876': {
    sku: '7750005009876',
    nombre: 'Modificativo de Leche Milo Nestlé 400g',
    categoria: 'Lácteos y Desayuno',
    unidadMedida: 'LATA',
    precioCompra: 11.2,
    precioVenta: 14.5,
    stockSugerido: 15,
    stockMinimoSugerido: 5,
    marca: 'Nestlé',
    formato: 'Lata 400g',
  },

  // Abarrotes y Granos
  '7750182001111': {
    sku: '7750182001111',
    nombre: 'Arroz Costeño Extra Selección 1 kg',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'BOLSA',
    precioCompra: 3.8,
    precioVenta: 4.8,
    stockSugerido: 40,
    stockMinimoSugerido: 15,
    marca: 'Costeño',
    formato: 'Bolsa 1 kg',
  },
  '7750182002222': {
    sku: '7750182002222',
    nombre: 'Arroz Faraón Extra Añejo Naranja 5 kg',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'BOLSA',
    precioCompra: 18.5,
    precioVenta: 23.5,
    stockSugerido: 18,
    stockMinimoSugerido: 8,
    marca: 'Faraón',
    formato: 'Saco 5 kg',
  },
  '7750243003333': {
    sku: '7750243003333',
    nombre: 'Aceite Vegetal Primor Clásico 900ml',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'BOTELLA',
    precioCompra: 7.2,
    precioVenta: 9.5,
    stockSugerido: 24,
    stockMinimoSugerido: 10,
    marca: 'Primor',
    formato: 'Botella 900ml',
  },
  '7750243004444': {
    sku: '7750243004444',
    nombre: 'Aceite Vegetal Cocinero 900ml',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'BOTELLA',
    precioCompra: 6.3,
    precioVenta: 8.2,
    stockSugerido: 20,
    stockMinimoSugerido: 8,
    marca: 'Cocinero',
    formato: 'Botella 900ml',
  },
  '7750186005555': {
    sku: '7750186005555',
    nombre: 'Fideos Don Vittorio Spaghetti 450g',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'PAQUETE',
    precioCompra: 2.4,
    precioVenta: 3.2,
    stockSugerido: 36,
    stockMinimoSugerido: 12,
    marca: 'Don Vittorio',
    formato: 'Paquete 450g',
  },
  '7750186006666': {
    sku: '7750186006666',
    nombre: 'Fideos Lavaggi Canuto Corto 250g',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'PAQUETE',
    precioCompra: 1.4,
    precioVenta: 2.0,
    stockSugerido: 24,
    stockMinimoSugerido: 10,
    marca: 'Lavaggi',
    formato: 'Paquete 250g',
  },
  '7750243019191': {
    sku: '7750243019191',
    nombre: 'Atún Primor Lomitos en Aceite Vegetal 170g',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'LATA',
    precioCompra: 5.4,
    precioVenta: 6.9,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: 'Primor',
    formato: 'Lata 170g',
  },
  '7750243020202': {
    sku: '7750243020202',
    nombre: 'Filete de Atún Florida en Aceite 170g',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'LATA',
    precioCompra: 4.5,
    precioVenta: 6.2,
    stockSugerido: 28,
    stockMinimoSugerido: 12,
    marca: 'Florida',
    formato: 'Lata 170g',
  },
  '7750186023232': {
    sku: '7750186023232',
    nombre: 'Sopa Instantánea Ajinomen Sabor Pollo 80g',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'PAQUETE',
    precioCompra: 1.4,
    precioVenta: 2.0,
    stockSugerido: 48,
    stockMinimoSugerido: 15,
    marca: 'Ajinomen',
    formato: 'Sobre 80g',
  },
  '7750182003333': {
    sku: '7750182003333',
    nombre: 'Azúcar Rubia Doméstica Paramonga 1 kg',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'BOLSA',
    precioCompra: 3.1,
    precioVenta: 4.0,
    stockSugerido: 35,
    stockMinimoSugerido: 10,
    marca: 'Paramonga',
    formato: 'Bolsa 1 kg',
  },
  '7750182004444': {
    sku: '7750182004444',
    nombre: 'Sal Marina de Mesa Emsal Yodada 1 kg',
    categoria: 'Abarrotes y Granos',
    unidadMedida: 'BOLSA',
    precioCompra: 1.2,
    precioVenta: 1.8,
    stockSugerido: 40,
    stockMinimoSugerido: 15,
    marca: 'Emsal',
    formato: 'Bolsa 1 kg',
  },

  // Bebidas y Licores
  '7750885007777': {
    sku: '7750885007777',
    nombre: 'Gaseosa Inca Kola Sabor Original 500ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 2.2,
    precioVenta: 3.0,
    stockSugerido: 48,
    stockMinimoSugerido: 18,
    marca: 'Inca Kola',
    formato: 'Botella descartable 500ml',
  },
  '7750885008888': {
    sku: '7750885008888',
    nombre: 'Gaseosa Coca Cola Sabor Original 500ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 2.2,
    precioVenta: 3.0,
    stockSugerido: 48,
    stockMinimoSugerido: 18,
    marca: 'Coca Cola',
    formato: 'Botella descartable 500ml',
  },
  '7750885009999': {
    sku: '7750885009999',
    nombre: 'Gaseosa Inca Kola Gordita Retornable 625ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 2.5,
    precioVenta: 3.5,
    stockSugerido: 36,
    stockMinimoSugerido: 12,
    marca: 'Inca Kola',
    formato: 'Botella vidrio 625ml',
  },
  '7750033001010': {
    sku: '7750033001010',
    nombre: 'Cerveza Cristal Rubia Botella 650ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 5.2,
    precioVenta: 7.0,
    stockSugerido: 60,
    stockMinimoSugerido: 24,
    marca: 'Backus - Cristal',
    formato: 'Botella 650ml',
  },
  '7750033002020': {
    sku: '7750033002020',
    nombre: 'Cerveza Pilsen Callao Botella 630ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 5.3,
    precioVenta: 7.0,
    stockSugerido: 60,
    stockMinimoSugerido: 24,
    marca: 'Backus - Pilsen',
    formato: 'Botella 630ml',
  },
  '7750033003030': {
    sku: '7750033003030',
    nombre: 'Cerveza Cusqueña Dorada Botella 310ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 3.8,
    precioVenta: 5.5,
    stockSugerido: 30,
    stockMinimoSugerido: 12,
    marca: 'Backus - Cusqueña',
    formato: 'Botella 310ml',
  },
  '7750885010101': {
    sku: '7750885010101',
    nombre: 'Agua Mineral San Luis Sin Gas 625ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 1.3,
    precioVenta: 2.0,
    stockSugerido: 40,
    stockMinimoSugerido: 15,
    marca: 'San Luis',
    formato: 'Botella 625ml',
  },
  '7750885011112': {
    sku: '7750885011112',
    nombre: 'Bebida Rehidratante Sporade Mandarina 500ml',
    categoria: 'Bebidas y Licores',
    unidadMedida: 'BOTELLA',
    precioCompra: 1.7,
    precioVenta: 2.5,
    stockSugerido: 24,
    stockMinimoSugerido: 8,
    marca: 'Sporade',
    formato: 'Botella 500ml',
  },

  // Snacks y Golosinas
  '7750189004040': {
    sku: '7750189004040',
    nombre: 'Galletas Margarita Sayón Paquete x 6',
    categoria: 'Snacks y Golosinas',
    unidadMedida: 'PAQUETE',
    precioCompra: 3.2,
    precioVenta: 4.5,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: 'Sayón',
    formato: 'Sixpack',
  },
  '7750189005050': {
    sku: '7750189005050',
    nombre: 'Galletas Casino Rellena de Fresa 6 unidades',
    categoria: 'Snacks y Golosinas',
    unidadMedida: 'PAQUETE',
    precioCompra: 2.8,
    precioVenta: 3.8,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: 'Victoria',
    formato: 'Sixpack',
  },
  '7750189006060': {
    sku: '7750189006060',
    nombre: 'Galletas Soda San Jorge Familiar 6 unidades',
    categoria: 'Snacks y Golosinas',
    unidadMedida: 'PAQUETE',
    precioCompra: 2.4,
    precioVenta: 3.2,
    stockSugerido: 35,
    stockMinimoSugerido: 12,
    marca: 'San Jorge',
    formato: 'Sixpack',
  },
  '7750075007070': {
    sku: '7750075007070',
    nombre: 'Papas Lays Clásicas con Sal 40g',
    categoria: 'Snacks y Golosinas',
    unidadMedida: 'BOLSA',
    precioCompra: 1.5,
    precioVenta: 2.2,
    stockSugerido: 40,
    stockMinimoSugerido: 15,
    marca: 'Frito-Lay',
    formato: 'Bolsa 40g',
  },
  '7750075008080': {
    sku: '7750075008080',
    nombre: 'Tortillas Doritos Mega Queso 45g',
    categoria: 'Snacks y Golosinas',
    unidadMedida: 'BOLSA',
    precioCompra: 1.6,
    precioVenta: 2.5,
    stockSugerido: 35,
    stockMinimoSugerido: 12,
    marca: 'Frito-Lay',
    formato: 'Bolsa 45g',
  },
  '7750075009090': {
    sku: '7750075009090',
    nombre: 'Chocolate Sublime Tradicional Nestlé 30g',
    categoria: 'Snacks y Golosinas',
    unidadMedida: 'UNIDAD',
    precioCompra: 1.6,
    precioVenta: 2.2,
    stockSugerido: 50,
    stockMinimoSugerido: 15,
    marca: 'Nestlé',
    formato: 'Barra 30g',
  },

  // Limpieza del Hogar
  '7750243009090': {
    sku: '7750243009090',
    nombre: 'Detergente en Polvo Bolívar Floral 800g',
    categoria: 'Limpieza del Hogar',
    unidadMedida: 'BOLSA',
    precioCompra: 7.5,
    precioVenta: 9.8,
    stockSugerido: 25,
    stockMinimoSugerido: 8,
    marca: 'Bolívar',
    formato: 'Bolsa 800g',
  },
  '7750243010101': {
    sku: '7750243010101',
    nombre: 'Detergente Opal Ultra Lavado Activo 750g',
    categoria: 'Limpieza del Hogar',
    unidadMedida: 'BOLSA',
    precioCompra: 6.9,
    precioVenta: 8.9,
    stockSugerido: 20,
    stockMinimoSugerido: 6,
    marca: 'Opal',
    formato: 'Bolsa 750g',
  },
  '7750243011111': {
    sku: '7750243011111',
    nombre: 'Lavavajillas en Pasta Sapolio Limón 350g',
    categoria: 'Limpieza del Hogar',
    unidadMedida: 'UNIDAD',
    precioCompra: 2.8,
    precioVenta: 3.9,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: 'Sapolio',
    formato: 'Pote 350g',
  },
  '7750243012121': {
    sku: '7750243012121',
    nombre: 'Lejía Desinfectante Clorox Tradicional 1 Litro',
    categoria: 'Limpieza del Hogar',
    unidadMedida: 'BOTELLA',
    precioCompra: 3.2,
    precioVenta: 4.5,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: 'Clorox',
    formato: 'Botella 1 Litro',
  },
  '7750153013131': {
    sku: '7750153013131',
    nombre: 'Jabón de Lavar Bolívar Blanco Clásico 210g',
    categoria: 'Limpieza del Hogar',
    unidadMedida: 'UNIDAD',
    precioCompra: 2.1,
    precioVenta: 3.0,
    stockSugerido: 40,
    stockMinimoSugerido: 15,
    marca: 'Bolívar',
    formato: 'Barra 210g',
  },
  '7750153014142': {
    sku: '7750153014142',
    nombre: 'Papel Higiénico Suave Rendidor Paquete x 4 rollos',
    categoria: 'Limpieza del Hogar',
    unidadMedida: 'PAQUETE',
    precioCompra: 4.2,
    precioVenta: 5.8,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: 'Suave',
    formato: '4 rollos',
  },

  // Cuidado Personal
  '7750153014141': {
    sku: '7750153014141',
    nombre: 'Shampoo Head & Shoulders Limpieza Renovadora 375ml',
    categoria: 'Cuidado Personal',
    unidadMedida: 'BOTELLA',
    precioCompra: 15.5,
    precioVenta: 19.9,
    stockSugerido: 15,
    stockMinimoSugerido: 5,
    marca: 'H&S',
    formato: 'Frasco 375ml',
  },
  '7750153015151': {
    sku: '7750153015151',
    nombre: 'Crema Dental Colgate Triple Acción 75ml',
    categoria: 'Cuidado Personal',
    unidadMedida: 'UNIDAD',
    precioCompra: 3.6,
    precioVenta: 4.9,
    stockSugerido: 30,
    stockMinimoSugerido: 10,
    marca: 'Colgate',
    formato: 'Tubo 75ml',
  },
  '7750153016161': {
    sku: '7750153016161',
    nombre: 'Jabón de Tocador Rexona Antibacterial 3x110g',
    categoria: 'Cuidado Personal',
    unidadMedida: 'PAQUETE',
    precioCompra: 5.8,
    precioVenta: 7.5,
    stockSugerido: 20,
    stockMinimoSugerido: 6,
    marca: 'Rexona',
    formato: 'Pack 3 unidades',
  },
};

/**
 * Normaliza y mapea categorías internacionales a las categorías estándar de KIPU'S ERP
 */
function mapearCategoria(categoriaCruda?: string): string {
  if (!categoriaCruda) return 'Abarrotes y Granos';
  const c = categoriaCruda.toLowerCase();

  if (c.includes('milk') || c.includes('lact') || c.includes('leche') || c.includes('yogurt') || c.includes('queso') || c.includes('dairy')) {
    return 'Lácteos y Desayuno';
  }
  if (c.includes('beverage') || c.includes('drink') || c.includes('gaseosa') || c.includes('cerveza') || c.includes('licor') || c.includes('agua') || c.includes('jugo')) {
    return 'Bebidas y Licores';
  }
  if (c.includes('snack') || c.includes('galleta') || c.includes('biscuit') || c.includes('dulce') || c.includes('chocolate') || c.includes('chip') || c.includes('papas')) {
    return 'Snacks y Golosinas';
  }
  if (c.includes('clean') || c.includes('deterg') || c.includes('limpieza') || c.includes('jabon') || c.includes('lavavaj')) {
    return 'Limpieza del Hogar';
  }
  if (c.includes('shampoo') || c.includes('dental') || c.includes('colgate') || c.includes('higiene') || c.includes('personal') || c.includes('beauty')) {
    return 'Cuidado Personal';
  }
  if (c.includes('bread') || c.includes('pan') || c.includes('pasteleria') || c.includes('torta')) {
    return 'Panadería y Pastelería';
  }
  if (c.includes('meat') || c.includes('embutido') || c.includes('congelado') || c.includes('pollo') || c.includes('carne')) {
    return 'Congelados y Embutidos';
  }
  if (c.includes('ferret') || c.includes('herramienta') || c.includes('hardware')) {
    return 'Ferretería y Bazar';
  }
  return 'Abarrotes y Granos';
}

/**
 * Infiere la unidad de medida según el texto de empaque
 */
function inferirUnidadMedida(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes('lata') || t.includes('can') || t.includes('conserva')) return 'LATA';
  if (t.includes('botella') || t.includes('bottle') || t.includes('litro') || t.includes('1l') || t.includes('500ml') || t.includes('625ml')) return 'BOTELLA';
  if (t.includes('bolsa') || t.includes('bag') || t.includes('saco') || t.includes('1 kg') || t.includes('5 kg')) return 'BOLSA';
  if (t.includes('paquete') || t.includes('pack') || t.includes('sixpack') || t.includes('pqt') || t.includes('spaghetti')) return 'PAQUETE';
  if (t.includes('caja') || t.includes('box')) return 'CAJA';
  return 'UNIDAD';
}

/**
 * Consulta un código de barras en:
 * 1. Catálogo de productos local del ERP
 * 2. Diccionario enriquecido de productos de alta rotación en Perú
 * 3. Open Food Facts API (con timeout rápido de 2.5s)
 */
export async function buscarProductoPorCodigo(
  codigo: string,
  productosExistentes: Producto[] = []
): Promise<BarcodeLookupResult> {
  const codeTrimmed = codigo.trim();
  if (!codeTrimmed) {
    return {
      status: 'desconocido',
      datos: {
        sku: `SKU-${Math.floor(10000 + Math.random() * 90000)}`,
        nombre: '',
        categoria: 'Abarrotes y Granos',
        unidadMedida: 'UNIDAD',
        precioCompra: 0,
        precioVenta: 0,
        stockSugerido: 10,
        stockMinimoSugerido: 5,
      },
      origen: 'nuevo',
    };
  }

  // 1. Revisar si ya existe en el catálogo actual del usuario
  const existente = productosExistentes.find(
    (p) =>
      p.sku.toLowerCase() === codeTrimmed.toLowerCase() ||
      p.id.toLowerCase() === codeTrimmed.toLowerCase()
  );
  if (existente) {
    return {
      status: 'existente_en_catalogo',
      producto: existente,
      origen: 'catalogo_local',
    };
  }

  // 2. Revisar base peruana preconfigurada
  if (CATALOGO_BARRAS_PERU[codeTrimmed]) {
    return {
      status: 'encontrado',
      datos: { ...CATALOGO_BARRAS_PERU[codeTrimmed] },
      origen: 'base_peru',
    };
  }

  // Búsqueda parcial si fue ingresado con prefijo o parte del SKU
  const itemPorPrefijo = Object.values(CATALOGO_BARRAS_PERU).find((item) =>
    item.sku.toLowerCase().includes(codeTrimmed.toLowerCase())
  );
  if (itemPorPrefijo) {
    return {
      status: 'encontrado',
      datos: { ...itemPorPrefijo },
      origen: 'base_peru',
    };
  }

  // 3. Intentar consulta externa a Open Food Facts con timeout de 2.5 segundos
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(codeTrimmed)}.json`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 1 && data.product) {
        const p = data.product;
        const nombreCrudo =
          p.product_name_es ||
          p.product_name ||
          (p.brands ? `${p.brands} ${p.quantity || ''}` : '') ||
          '';

        const marca = p.brands || '';
        const cantidad = p.quantity || '';
        const nombreFinal = [nombreCrudo, marca && !nombreCrudo.includes(marca) ? `(${marca})` : '', cantidad && !nombreCrudo.includes(cantidad) ? cantidad : '']
          .filter(Boolean)
          .join(' ')
          .trim();

        if (nombreFinal) {
          const categoria = mapearCategoria(p.categories || p.categories_tags?.join(' '));
          const unidad = inferirUnidadMedida(nombreFinal + ' ' + (p.packaging || ''));

          return {
            status: 'encontrado',
            datos: {
              sku: codeTrimmed,
              nombre: nombreFinal,
              categoria,
              unidadMedida: unidad,
              precioCompra: 0,
              precioVenta: 0,
              stockSugerido: 12,
              stockMinimoSugerido: 5,
              marca,
              formato: cantidad,
            },
            origen: 'open_food_facts',
          };
        }
      }
    }
  } catch {
    // Timeout o sin conexión: ignorar y retornar desconocido
  }

  // 4. No encontrado: devolver estructura lista con el código como SKU
  return {
    status: 'desconocido',
    datos: {
      sku: codeTrimmed,
      nombre: '',
      categoria: 'Abarrotes y Granos',
      unidadMedida: 'UNIDAD',
      precioCompra: 0,
      precioVenta: 0,
      stockSugerido: 10,
      stockMinimoSugerido: 5,
    },
    origen: 'nuevo',
  };
}

/**
 * Lista de ejemplos para pruebas rápidas de escáner en bodegas
 */
export const EJEMPLOS_ESCANER_BODEGA = [
  { label: 'Leche Gloria Azul', codigo: '7750106001234', desc: 'Lata 400g' },
  { label: 'Inca Kola 500ml', codigo: '7750885007777', desc: 'Botella retornable' },
  { label: 'Arroz Costeño 1kg', codigo: '7750182001111', desc: 'Bolsa 1 kg' },
  { label: 'Aceite Primor 900ml', codigo: '7750243003333', desc: 'Botella 900ml' },
  { label: 'Detergente Bolívar 800g', codigo: '7750243009090', desc: 'Bolsa 800g' },
  { label: 'Fideos Don Vittorio 450g', codigo: '7750186005555', desc: 'Spaghetti' },
  { label: 'Cerveza Cristal 650ml', codigo: '7750033001010', desc: 'Botella 650ml' },
  { label: 'Galletas Soda San Jorge', codigo: '7750189006060', desc: 'Paquete x 6' },
];
