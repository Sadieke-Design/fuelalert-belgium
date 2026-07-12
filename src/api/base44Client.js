export const base44 = {
  auth: {
    me: async () => null,
    logout: () => {},
  },

  entities: {
    Favorite: {
      list: async () => [],
      create: async () => {},
      delete: async () => {},
    },

    AlertSetting: {
      list: async () => [],
      create: async () => {},
      update: async () => {},
    },

    FuelPrice: {
      list: async () => [],
      create: async () => {},
      update: async () => {},
    },

    FuelStation: {
      list: async () => [],
    },

    Notification: {
      create: async () => {},
    },
  },
};
