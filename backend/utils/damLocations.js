/**
 * Comprehensive India Dam Database
 * ─────────────────────────────────
 * 50+ major dams across 20+ states, covering every major river basin.
 * Coordinates & capacities sourced from CWC / NRLD public records.
 * Capacity is in TMC (Thousand Million Cubic feet) unless noted.
 *
 * All live APIs (Open-Meteo, GloFAS, NASA POWER, USGS) accept any lat/lon
 * worldwide, so adding a dam is as simple as adding an entry here.
 */
const damLocations = [
  // ── Gujarat ──────────────────────────────────────────
  { id: 'sardar-sarovar',   name: 'Sardar Sarovar',        latitude: 21.830, longitude: 73.748, state: 'Gujarat',            capacity: 163,    river: 'Narmada'      },
  { id: 'ukai',             name: 'Ukai',                  latitude: 21.256, longitude: 73.586, state: 'Gujarat',            capacity: 275,    river: 'Tapi'         },
  { id: 'kadana',           name: 'Kadana',                latitude: 23.301, longitude: 73.848, state: 'Gujarat',            capacity: 137,    river: 'Mahi'         },
  { id: 'dharoi',           name: 'Dharoi',                latitude: 23.877, longitude: 72.831, state: 'Gujarat',            capacity: 47,     river: 'Sabarmati'    },

  // ── Himachal Pradesh ─────────────────────────────────
  { id: 'bhakra-nangal',    name: 'Bhakra Nangal',         latitude: 31.416, longitude: 76.434, state: 'Himachal Pradesh',   capacity: 169,    river: 'Sutlej'       },
  { id: 'pong',             name: 'Pong',                  latitude: 31.983, longitude: 76.050, state: 'Himachal Pradesh',   capacity: 292,    river: 'Beas'         },
  { id: 'pandoh',           name: 'Pandoh',                latitude: 31.669, longitude: 77.057, state: 'Himachal Pradesh',   capacity: 0.4,    river: 'Beas'         },

  // ── Uttarakhand ──────────────────────────────────────
  { id: 'tehri',            name: 'Tehri',                 latitude: 30.378, longitude: 78.483, state: 'Uttarakhand',        capacity: 86,     river: 'Bhagirathi'   },
  { id: 'koteshwar',        name: 'Koteshwar',             latitude: 30.402, longitude: 78.529, state: 'Uttarakhand',        capacity: 1.5,    river: 'Bhagirathi'   },

  // ── Punjab ───────────────────────────────────────────
  { id: 'ranjit-sagar',     name: 'Ranjit Sagar (Thein)',  latitude: 32.474, longitude: 75.742, state: 'Punjab',             capacity: 136,    river: 'Ravi'         },

  // ── Rajasthan ────────────────────────────────────────
  { id: 'rana-pratap-sagar', name: 'Rana Pratap Sagar',    latitude: 24.913, longitude: 75.581, state: 'Rajasthan',          capacity: 139,    river: 'Chambal'      },
  { id: 'bisalpur',         name: 'Bisalpur',              latitude: 25.928, longitude: 75.341, state: 'Rajasthan',          capacity: 117,    river: 'Banas'        },
  { id: 'jawahar-sagar',    name: 'Jawahar Sagar',         latitude: 24.864, longitude: 75.596, state: 'Rajasthan',          capacity: 5.6,    river: 'Chambal'      },
  { id: 'mahi-bajaj-sagar', name: 'Mahi Bajaj Sagar',     latitude: 23.763, longitude: 74.317, state: 'Rajasthan',          capacity: 129,    river: 'Mahi'         },

  // ── Madhya Pradesh ───────────────────────────────────
  { id: 'indira-sagar',     name: 'Indira Sagar',          latitude: 22.285, longitude: 76.467, state: 'Madhya Pradesh',     capacity: 396,    river: 'Narmada'      },
  { id: 'gandhi-sagar',     name: 'Gandhi Sagar',          latitude: 24.734, longitude: 75.580, state: 'Madhya Pradesh',     capacity: 269,    river: 'Chambal'      },
  { id: 'tawa',             name: 'Tawa',                  latitude: 22.663, longitude: 77.863, state: 'Madhya Pradesh',     capacity: 73,     river: 'Tawa'         },
  { id: 'bargi',            name: 'Bargi',                 latitude: 23.012, longitude: 79.943, state: 'Madhya Pradesh',     capacity: 115,    river: 'Narmada'      },
  { id: 'bansagar',         name: 'Ban Sagar',             latitude: 24.189, longitude: 81.332, state: 'Madhya Pradesh',     capacity: 135,    river: 'Son'          },

  // ── Maharashtra ──────────────────────────────────────
  { id: 'koyna',            name: 'Koyna',                 latitude: 17.383, longitude: 73.750, state: 'Maharashtra',        capacity: 105.2,  river: 'Koyna'        },
  { id: 'jayakwadi',        name: 'Jayakwadi',             latitude: 19.508, longitude: 75.379, state: 'Maharashtra',        capacity: 80,     river: 'Godavari'     },
  { id: 'ujani',            name: 'Ujani',                 latitude: 18.041, longitude: 75.098, state: 'Maharashtra',        capacity: 117,    river: 'Bhima'        },
  { id: 'bhatsa',           name: 'Bhatsa',                latitude: 19.497, longitude: 73.435, state: 'Maharashtra',        capacity: 30,     river: 'Bhatsa'       },
  { id: 'irai',             name: 'Irai',                  latitude: 20.137, longitude: 79.043, state: 'Maharashtra',        capacity: 10,     river: 'Irai'         },

  // ── Karnataka ────────────────────────────────────────
  { id: 'krishna-raja-sagara', name: 'Krishna Raja Sagara', latitude: 12.431, longitude: 76.573, state: 'Karnataka',        capacity: 49,     river: 'Kaveri'       },
  { id: 'tungabhadra',      name: 'Tungabhadra',           latitude: 15.267, longitude: 76.337, state: 'Karnataka',          capacity: 133,    river: 'Tungabhadra'  },
  { id: 'almatti',          name: 'Almatti',               latitude: 16.348, longitude: 75.889, state: 'Karnataka',          capacity: 123,    river: 'Krishna'      },
  { id: 'linganamakki',     name: 'Linganamakki',          latitude: 14.189, longitude: 74.848, state: 'Karnataka',          capacity: 152,    river: 'Sharavathi'   },
  { id: 'kabini',           name: 'Kabini',                latitude: 11.951, longitude: 76.323, state: 'Karnataka',          capacity: 19,     river: 'Kabini'       },

  // ── Tamil Nadu ───────────────────────────────────────
  { id: 'mettur',           name: 'Mettur',                latitude: 11.792, longitude: 77.801, state: 'Tamil Nadu',         capacity: 93.5,   river: 'Kaveri'       },
  { id: 'vaigai',           name: 'Vaigai',                latitude: 10.019, longitude: 77.555, state: 'Tamil Nadu',         capacity: 6.1,    river: 'Vaigai'       },
  { id: 'bhavanisagar',     name: 'Bhavanisagar',          latitude: 11.463, longitude: 77.093, state: 'Tamil Nadu',         capacity: 32.8,   river: 'Bhavani'      },
  { id: 'amaravathi',       name: 'Amaravathi',            latitude: 10.414, longitude: 77.256, state: 'Tamil Nadu',         capacity: 4.1,    river: 'Amaravathi'   },

  // ── Kerala ───────────────────────────────────────────
  { id: 'idukki',           name: 'Idukki',                latitude: 9.841,  longitude: 76.970, state: 'Kerala',             capacity: 70.5,   river: 'Periyar'      },
  { id: 'mullaperiyar',     name: 'Mullaperiyar',          latitude: 9.532,  longitude: 77.143, state: 'Kerala',             capacity: 13.6,   river: 'Periyar'      },
  { id: 'banasura-sagar',   name: 'Banasura Sagar',        latitude: 11.667, longitude: 76.033, state: 'Kerala',             capacity: 6.3,    river: 'Kabini'       },
  { id: 'kakki',            name: 'Kakki',                 latitude: 9.324,  longitude: 77.137, state: 'Kerala',             capacity: 14.5,   river: 'Kakki'        },

  // ── Andhra Pradesh ───────────────────────────────────
  { id: 'nagarjuna-sagar',  name: 'Nagarjuna Sagar',       latitude: 16.576, longitude: 79.313, state: 'Andhra Pradesh',     capacity: 405,    river: 'Krishna'      },
  { id: 'srisailam',        name: 'Srisailam',             latitude: 15.851, longitude: 78.868, state: 'Andhra Pradesh',     capacity: 273,    river: 'Krishna'      },
  { id: 'somasila',         name: 'Somasila',              latitude: 15.312, longitude: 79.309, state: 'Andhra Pradesh',     capacity: 78,     river: 'Pennar'       },

  // ── Telangana ────────────────────────────────────────
  { id: 'sriramsagar',      name: 'Sriramsagar',           latitude: 18.962, longitude: 78.341, state: 'Telangana',          capacity: 112,    river: 'Godavari'     },
  { id: 'singur',           name: 'Singur',                latitude: 17.756, longitude: 77.934, state: 'Telangana',          capacity: 30,     river: 'Manjira'      },

  // ── Odisha ───────────────────────────────────────────
  { id: 'hirakud',          name: 'Hirakud',               latitude: 21.519, longitude: 83.867, state: 'Odisha',             capacity: 266,    river: 'Mahanadi'     },
  { id: 'rengali',          name: 'Rengali',               latitude: 21.286, longitude: 84.055, state: 'Odisha',             capacity: 72,     river: 'Brahmani'     },
  { id: 'upper-indravati',  name: 'Upper Indravati',       latitude: 19.614, longitude: 82.800, state: 'Odisha',             capacity: 46,     river: 'Indravati'    },

  // ── Jharkhand ────────────────────────────────────────
  { id: 'maithon',          name: 'Maithon',               latitude: 23.773, longitude: 86.813, state: 'Jharkhand',          capacity: 61,     river: 'Barakar'      },
  { id: 'panchet',          name: 'Panchet',               latitude: 23.676, longitude: 86.742, state: 'Jharkhand',          capacity: 47,     river: 'Damodar'      },
  { id: 'tenughat',         name: 'Tenughat',              latitude: 23.616, longitude: 85.803, state: 'Jharkhand',          capacity: 16,     river: 'Damodar'      },

  // ── West Bengal ──────────────────────────────────────
  { id: 'massanjore',       name: 'Massanjore (Canada)',   latitude: 24.050, longitude: 87.300, state: 'West Bengal',         capacity: 54,     river: 'Mayurakshi'   },

  // ── Chhattisgarh ─────────────────────────────────────
  { id: 'gangrel',          name: 'Gangrel',               latitude: 20.839, longitude: 81.664, state: 'Chhattisgarh',       capacity: 42,     river: 'Mahanadi'     },
  { id: 'minimata-bango',   name: 'Minimata (Bango)',      latitude: 22.990, longitude: 82.364, state: 'Chhattisgarh',       capacity: 105,    river: 'Hasdeo'       },

  // ── Goa ──────────────────────────────────────────────
  { id: 'selaulim',         name: 'Selaulim',              latitude: 15.216, longitude: 74.079, state: 'Goa',                capacity: 7.7,    river: 'Selaulim'     },

  // ── Jammu & Kashmir ──────────────────────────────────
  { id: 'baglihar',         name: 'Baglihar',              latitude: 33.142, longitude: 75.809, state: 'Jammu & Kashmir',     capacity: 16,     river: 'Chenab'       },
  { id: 'salal',            name: 'Salal',                 latitude: 33.140, longitude: 74.808, state: 'Jammu & Kashmir',     capacity: 10.5,   river: 'Chenab'       },

  // ── Northeast ────────────────────────────────────────
  { id: 'umiam',            name: 'Umiam',                 latitude: 25.655, longitude: 91.893, state: 'Meghalaya',           capacity: 5,      river: 'Umiam'        },
  { id: 'doyang',           name: 'Doyang',                latitude: 26.156, longitude: 93.700, state: 'Nagaland',            capacity: 7.5,    river: 'Doyang'       },
  { id: 'ranganadi',        name: 'Ranganadi',             latitude: 27.252, longitude: 93.662, state: 'Arunachal Pradesh',   capacity: 2,      river: 'Ranganadi'    },
  { id: 'kopili',           name: 'Kopili',                latitude: 25.657, longitude: 92.609, state: 'Assam',               capacity: 6.8,    river: 'Kopili'       },
  { id: 'mapithel',         name: 'Mapithel',              latitude: 25.200, longitude: 94.209, state: 'Manipur',             capacity: 3.6,    river: 'Thoubal'      },

  // ── Uttar Pradesh ────────────────────────────────────
  { id: 'rihand',           name: 'Rihand',                latitude: 24.199, longitude: 83.004, state: 'Uttar Pradesh',       capacity: 260,    river: 'Rihand'       },
  { id: 'matatila',         name: 'Matatila',              latitude: 25.030, longitude: 78.350, state: 'Uttar Pradesh',       capacity: 28,     river: 'Betwa'        },
];

/**
 * Landslide-prone zones — mapped to states for regional susceptibility scoring.
 * Used by riskAnalysisService to boost landslide scores for dams in prone areas.
 */
const landslidePrones = [
  {
    id: 'western-ghats',
    name: 'Western Ghats',
    states: ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Goa'],
    riskLevel: 'HIGH'
  },
  {
    id: 'himalayas',
    name: 'Himalayas',
    states: ['Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir'],
    riskLevel: 'HIGH'
  },
  {
    id: 'northeast-hills',
    name: 'Northeast Hills',
    states: ['Assam', 'Meghalaya', 'Mizoram', 'Nagaland', 'Manipur', 'Arunachal Pradesh', 'Tripura', 'Sikkim'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'eastern-ghats',
    name: 'Eastern Ghats',
    states: ['Odisha', 'Andhra Pradesh', 'Telangana'],
    riskLevel: 'MEDIUM'
  },
  {
    id: 'vindhya-satpura',
    name: 'Vindhya-Satpura Ranges',
    states: ['Madhya Pradesh', 'Chhattisgarh', 'Jharkhand'],
    riskLevel: 'LOW'
  }
];

module.exports = {
  damLocations,
  landslidePrones
};
