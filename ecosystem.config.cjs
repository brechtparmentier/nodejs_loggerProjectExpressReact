module.exports = {
    apps: [{
      name: "log-express",
      script: "./server.js",
      autorestart: true,
      watch: true,
      ignore_watch: ["node_modules", "public", "logs", ".git"],
    }]
  };
  