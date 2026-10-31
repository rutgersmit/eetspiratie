// Container start script. The data folder is usually a bind mount created by
// the host user, so when started as root we hand it to the unprivileged app
// user (uid/gid 1001) and drop root before loading the Next.js server.
const fs = require("node:fs");
const path = require("node:path");

const APP_UID = 1001;
const APP_GID = 1001;

function chownTree(target) {
  const stat = fs.lstatSync(target);
  if (stat.uid !== APP_UID || stat.gid !== APP_GID) fs.lchownSync(target, APP_UID, APP_GID);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) chownTree(path.join(target, entry));
  }
}

if (process.getuid && process.getuid() === 0) {
  const dataDir = process.env.DATA_DIR || "/app/data";
  fs.mkdirSync(dataDir, { recursive: true });
  chownTree(dataDir);
  process.setgroups([]);
  process.setgid(APP_GID);
  process.setuid(APP_UID);
}

require(path.join(__dirname, "..", "server.js"));
