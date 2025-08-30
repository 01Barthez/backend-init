import { envs } from "@/config/env/env";
import chalk from "chalk";

export const displayStartupMessage = (port: number = envs.PORT) => {
    // ==== HEADER BANNER ====
    const banner = `
${chalk.bgHex('#1a1a2e').white(' ███████████████████████████████████████████████████████████████████████████████████ ')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white('                                                                              ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white('  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ▄▄▄▄▄▄▄▄▄▄▄  ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white(' ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌ ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white(' ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌▐░█▀▀▀▀▀▀▀▀▀ ▐░█▀▀▀▀▀▀▀█░▌ ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white(' ▐░▌          ▐░▌          ▐░▌       ▐░▌          ▐░▌       ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white(' ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌▐░█▄▄▄▄▄▄▄▄▄ ▐░█▄▄▄▄▄▄▄█░▌ ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white(' ▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌▐░░░░░░░░░░░▌ ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white(' ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ▀▀▀▀▀▀▀▀▀▀▀  ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white('                                                                              ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.hex('#00ffff').bold('   █▀▄▀█ █▀█ █▄░█ █▀▀ ▀█▀ █▀█ █░█ █░░ ▄▀█ ▀█▀ █▀▀ █▀▄   ').padStart(48).padEnd(60)}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.hex('#00ffff').bold('   █░▀░█ █▄█ █░▀█ ██▄ ░█░ █▀▄ █▄█ █▄▄ █▀█ ░█░ ██▄ █▄▀   ').padStart(48).padEnd(60)}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.bgHex('#16213e').white('                                                                              ')}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white('█')}${chalk.hex('#e94560').bold(`     WELCOME TO YOUR BACKEND SERVER - MADE BY ${chalk.underline('BARTHEZ KENWOU')}     `).padStart(50).padEnd(60)}${chalk.bgHex('#1a1a2e').white('█')}
${chalk.bgHex('#1a1a2e').white(' ███████████████████████████████████████████████████████████████████████████████████ ')}
`;
    console.log(banner);

    // ==== APP INFO ====
    console.log(
        chalk.hex('#00ffff').bold('\n ╭───────────────────────────────────────────────────────────────╮') +
        chalk.hex('#00ffff').bold('\n │ ') + chalk.hex('#e94560').bold('APPLICATION') + chalk.hex('#00ffff').bold('                                          │') +
        chalk.hex('#00ffff').bold('\n ╰───────────────────────────────────────────────────────────────╯')
    );
    console.log(
        chalk.hex('#00b4d8')('│ ') + chalk.bold('Name:        ') + chalk.white(envs.APP_NAME) + chalk.hex('#00b4d8')('                     │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Description: ') + chalk.white(envs.APP_DESCRIPTION) + chalk.hex('#00b4d8')('                 │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Author:      ') + chalk.white(envs.APP_AUTHOR) + chalk.hex('#00b4d8')('                     │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('License:     ') + chalk.white(envs.APP_LICENSE) + chalk.hex('#00b4d8')('                     │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Version:     ') + chalk.white(envs.APP_VERSION) + chalk.hex('#00b4d8')('                     │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Environment: ') + chalk.white(envs.NODE_ENV) + chalk.hex('#00b4d8')('                      │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Database:    ') + chalk.white(envs.DB_TYPE) + chalk.hex('#00b4d8')('                     │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Port:        ') + chalk.white(envs.PORT) + chalk.hex('#00b4d8')('                          │') +
        '\n' + chalk.hex('#00b4d8')('╰───────────────────────────────────────────────────────────────╯')
    );

    // ==== SYSTEM INFO ====
    console.log(
        chalk.hex('#00ffff').bold('\n ╭───────────────────────────────────────────────────────────────╮') +
        chalk.hex('#00ffff').bold('\n │ ') + chalk.hex('#e94560').bold('RUNTIME') + chalk.hex('#00ffff').bold('                                             │') +
        chalk.hex('#00ffff').bold('\n ╰───────────────────────────────────────────────────────────────╯')
    );
    console.log(
        chalk.hex('#00b4d8')('│ ') + chalk.bold('Timezone:     ') + chalk.white(Intl.DateTimeFormat().resolvedOptions().timeZone) + chalk.hex('#00b4d8')('          │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Logs Dir:    ') + chalk.white(process.cwd() + "/logs") + chalk.hex('#00b4d8')('               │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('PID:        ') + chalk.white(process.pid) + chalk.hex('#00b4d8')('                          │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Uptime:      ') + chalk.white(process.uptime().toFixed(2) + " seconds") + chalk.hex('#00b4d8')('           │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Memory:      ') + chalk.white(JSON.stringify(process.memoryUsage().heapUsed / 1024 / 1024).slice(0, 6) + " MB") + chalk.hex('#00b4d8')('          │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Node.js:     ') + chalk.white(process.version) + chalk.hex('#00b4d8')('                      │') +
        '\n' + chalk.hex('#00b4d8')('│ ') + chalk.bold('Platform:    ') + chalk.white(process.platform + " (" + process.arch + ")") + chalk.hex('#00b4d8')('          │') +
        '\n' + chalk.hex('#00b4d8')('╰───────────────────────────────────────────────────────────────╯')
    );

}
