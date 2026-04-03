const os = require("os");
const { spawn } = require("child_process");

function detectLanIPv4() {
  const nets = os.networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const info of entries || []) {
      if (
        info &&
        info.family === "IPv4" &&
        !info.internal &&
        !info.address.startsWith("169.254.")
      ) {
        return info.address;
      }
    }
  }
  return null;
}

const lanIp = detectLanIPv4();
if (!lanIp) {
  console.error("Impossible de detecter une IP LAN IPv4 active.");
  process.exit(1);
}

console.log(`IP LAN detectee: ${lanIp}`);
console.log("Lancement Expo Go en LAN (sans emulateur)...");
console.log("N'appuie pas sur 'a'. Ouvre Expo Go et scanne le QR.");

const env = {
  ...process.env,
  EXPO_NO_DEPENDENCY_VALIDATION: "",
  REACT_NATIVE_PACKAGER_HOSTNAME: lanIp,
};

const expoCommand = [
  'if exist "node_modules\\@expo\\cli\\build\\bin\\cli" (',
  '  node node_modules\\@expo\\cli\\build\\bin\\cli start --host lan --port 8081 --clear',
  ') else (',
  '  node node_modules\\expo\\bin\\cli start --host lan --port 8081 --clear',
  ")",
].join(" ");
const child = spawn(expoCommand, [], {
  stdio: "inherit",
  env,
  // Windows + Node 24 can fail with spawn EINVAL on .cmd.
  // shell:true delegates command resolution to cmd.exe.
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

