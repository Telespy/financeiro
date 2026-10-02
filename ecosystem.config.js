module.exports = {
  apps: [
    {
      name: "money-control-app",
      script: "./server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "250M",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      },
      error_file: "./logs/pm2-err.log",
      out_file: "./logs/pm2-out.log",
      time: true
    }
  ]
};
