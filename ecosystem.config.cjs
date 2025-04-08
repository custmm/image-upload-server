module.exports = {
  apps : [
    {
    name: "image-upload-server", // 앱 이름
    script: 'src/index.js',
    watch: false,
    env:{
      NODE_ENV: "development",
      PORT: 42057,
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 42057,
    }
  }
],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
