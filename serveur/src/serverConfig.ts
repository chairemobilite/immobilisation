const rawPort = process.env.SERVER_PORT;
const parsedPort = rawPort !== undefined ? parseInt(rawPort, 10) : NaN;

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error(`Invalid SERVER_PORT: "${rawPort}". Must be an integer between 1 and 65535.`);
}

const serverConfig = {
  server: { port: parsedPort },
};

export default serverConfig;