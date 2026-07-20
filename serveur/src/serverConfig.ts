

const serverConfig={
  server: {
    port: Number(process.env.SERVER_PORT || '3001')>2000&&
          Number(process.env.SERVER_PORT || '3001')<6000?
          Number(process.env.SERVER_PORT || '3001'):3000
  }
};

export default serverConfig;