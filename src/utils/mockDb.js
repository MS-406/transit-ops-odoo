const DEFAULT_VEHICLES = [
  {
    id: 'v-1',
    registration_number: 'KCB 123A',
    model: 'Scania R450',
    type: 'Heavy Hauler',
    capacity: 25, // tons
    odometer: 142500, // km
    region: 'Nairobi East',
    status: 'Available',
    fuel_efficiency: 5.8, // km/L
    fuel_logs: [
      { date: '2026-07-01', liters: 150, cost: 225 },
      { date: '2026-07-08', liters: 180, cost: 270 }
    ],
    maintenance_records: [
      { date: '2026-06-15', description: 'Engine oil filter replacement', cost: 120, status: 'Closed' }
    ]
  },
  {
    id: 'v-2',
    registration_number: 'KCD 456B',
    model: 'Toyota Dyna',
    type: 'Box Body',
    capacity: 7.5,
    odometer: 98400,
    region: 'Nairobi West',
    status: 'On Trip',
    fuel_efficiency: 7.2,
    fuel_logs: [
      { date: '2026-07-03', liters: 60, cost: 90 },
      { date: '2026-07-10', liters: 55, cost: 82.5 }
    ],
    maintenance_records: []
  },
  {
    id: 'v-3',
    registration_number: 'KCE 789C',
    model: 'Mercedes Actros',
    type: 'Dry Van',
    capacity: 20,
    odometer: 215700,
    region: 'Mombasa Port',
    status: 'In Shop',
    fuel_efficiency: 6.0,
    fuel_logs: [
      { date: '2026-07-02', liters: 200, cost: 300 }
    ],
    maintenance_records: [
      { date: '2026-07-11', description: 'Brake pad renewal', cost: 350, status: 'Open' }
    ]
  },
  {
    id: 'v-4',
    registration_number: 'KAA 001Z',
    model: 'Volvo FH16',
    type: 'Flatbed',
    capacity: 30,
    odometer: 480200,
    region: 'Out of Service',
    status: 'Retired',
    fuel_efficiency: 5.2,
    fuel_logs: [],
    maintenance_records: []
  }
];

const DEFAULT_DRIVERS = [
  {
    id: 'd-1',
    name: 'John Doe',
    license_class: 'Class A, CE',
    license_expiry: '2027-04-10',
    safety_score: 95,
    status: 'Available',
    trip_history: ['TR-712']
  },
  {
    id: 'd-2',
    name: 'Jane Watson',
    license_class: 'Class B, C',
    license_expiry: '2026-07-25', // Near expiry
    safety_score: 89,
    status: 'On Trip',
    trip_history: ['TR-872']
  },
  {
    id: 'd-3',
    name: 'Bob Johnson',
    license_class: 'Class E, F',
    license_expiry: '2026-06-15', // Expired
    safety_score: 76,
    status: 'Suspended',
    trip_history: []
  },
  {
    id: 'd-4',
    name: 'Alice Smith',
    license_class: 'Class A, B',
    license_expiry: '2028-09-30',
    safety_score: 98,
    status: 'Available',
    trip_history: []
  }
];

const DEFAULT_TRIPS = [
  {
    id: 'TR-712',
    source: 'Nairobi Depot',
    destination: 'Mombasa Port',
    vehicle_id: 'v-1',
    driver_id: 'd-1',
    cargo_weight: 12.0,
    planned_distance: 480,
    status: 'Completed',
    created_at: '2026-07-10T10:00:00Z',
    completed_at: '2026-07-11T16:30:00Z',
    final_odometer: 142500,
    fuel_consumed: 82.7
  },
  {
    id: 'TR-872',
    source: 'Mombasa Port',
    destination: 'Nairobi East',
    vehicle_id: 'v-2',
    driver_id: 'd-2',
    cargo_weight: 5.5,
    planned_distance: 480,
    status: 'Dispatched',
    created_at: '2026-07-11T08:00:00Z'
  },
  {
    id: 'TR-990',
    source: 'Nairobi Depot',
    destination: 'Mombasa Port',
    vehicle_id: 'v-1',
    driver_id: 'd-4',
    cargo_weight: 8.5,
    planned_distance: 480,
    status: 'Draft',
    created_at: '2026-07-12T05:00:00Z'
  }
];

const initializeDb = () => {
  if (!localStorage.getItem('to_vehicles')) {
    localStorage.setItem('to_vehicles', JSON.stringify(DEFAULT_VEHICLES));
  }
  if (!localStorage.getItem('to_drivers')) {
    localStorage.setItem('to_drivers', JSON.stringify(DEFAULT_DRIVERS));
  }
  if (!localStorage.getItem('to_trips')) {
    localStorage.setItem('to_trips', JSON.stringify(DEFAULT_TRIPS));
  }
};

// Initialize right away
initializeDb();

export const mockDb = {
  // VEHICLES CRUD
  getVehicles: () => {
    return JSON.parse(localStorage.getItem('to_vehicles'));
  },
  getVehicleById: (id) => {
    const list = JSON.parse(localStorage.getItem('to_vehicles'));
    return list.find(v => v.id === id);
  },
  saveVehicle: (vehicle) => {
    const list = JSON.parse(localStorage.getItem('to_vehicles'));
    let updated;
    if (vehicle.id) {
      updated = list.map(v => v.id === vehicle.id ? { ...v, ...vehicle } : v);
    } else {
      const newVehicle = {
        ...vehicle,
        id: `v-${Math.random().toString(36).substr(2, 9)}`,
        fuel_logs: [],
        maintenance_records: [],
        fuel_efficiency: vehicle.fuel_efficiency || 6.0
      };
      updated = [...list, newVehicle];
    }
    localStorage.setItem('to_vehicles', JSON.stringify(updated));
    return vehicle.id ? vehicle : updated[updated.length - 1];
  },
  deleteVehicle: (id) => {
    const list = JSON.parse(localStorage.getItem('to_vehicles'));
    const updated = list.filter(v => v.id !== id);
    localStorage.setItem('to_vehicles', JSON.stringify(updated));
    return true;
  },

  // DRIVERS CRUD
  getDrivers: () => {
    return JSON.parse(localStorage.getItem('to_drivers'));
  },
  getDriverById: (id) => {
    const list = JSON.parse(localStorage.getItem('to_drivers'));
    return list.find(d => d.id === id);
  },
  saveDriver: (driver) => {
    const list = JSON.parse(localStorage.getItem('to_drivers'));
    let updated;
    if (driver.id) {
      updated = list.map(d => d.id === driver.id ? { ...d, ...driver } : d);
    } else {
      const newDriver = {
        ...driver,
        id: `d-${Math.random().toString(36).substr(2, 9)}`,
        safety_score: driver.safety_score || 90,
        trip_history: []
      };
      updated = [...list, newDriver];
    }
    localStorage.setItem('to_drivers', JSON.stringify(updated));
    return driver.id ? driver : updated[updated.length - 1];
  },

  // TRIPS CRUD
  getTrips: () => {
    return JSON.parse(localStorage.getItem('to_trips'));
  },
  getTripById: (id) => {
    const list = JSON.parse(localStorage.getItem('to_trips'));
    return list.find(t => t.id === id);
  },
  saveTrip: (trip) => {
    const list = JSON.parse(localStorage.getItem('to_trips'));
    let updated;
    if (trip.id) {
      updated = list.map(t => t.id === trip.id ? { ...t, ...trip } : t);
    } else {
      const newTrip = {
        ...trip,
        id: `TR-${Math.floor(100 + Math.random() * 900)}`,
        created_at: new Date().toISOString()
      };
      updated = [...list, newTrip];
    }
    localStorage.setItem('to_trips', JSON.stringify(updated));
    return trip.id ? trip : updated[updated.length - 1];
  }
};
