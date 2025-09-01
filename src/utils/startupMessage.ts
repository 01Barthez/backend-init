import chalk from 'chalk';

import { envs } from '@/config/env/env';

const serverText = 'SERVER ARCHITECTURE';
export const gradientColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
export const topBorder = chalk.hex('#2c3e50')('╔' + '═'.repeat(55) + '╗');
export const bottomBorder = chalk.hex('#2c3e50')('╚' + '═'.repeat(55) + '╝');
export const sideBorder = chalk.hex('#2c3e50')('║');
//
const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
const uptime = process.uptime().toFixed(2);
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
//
const runtimeHeader =
  chalk.hex('#8e44ad')('\n┌─── ') +
  chalk.hex('#e74c3c').bold('RUNTIME INFORMATION') +
  chalk.hex('#8e44ad')(' ────────────────────────────────────┐');
const runtimeFooter = chalk.hex('#8e44ad')(
  '└────────────────────────────────────────────────────────────┘',
);
const linkedName = `\u001b]8;;https://www.linkedin.com/in/barthez-kenwou/\u0007BARTHEZ KENWOU\u001b]8;;\u0007`;

export const displayStartupMessage = (port: number = envs.PORT) => {
  // ==== HEADER BANNER ====
  const banner = `
${chalk.bgHex('#91f70c').white(' █████████████████████████████████████████████████████████████████████████')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.bgHex('#00ffff').bold('').padEnd(69)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#0cf73f').bold('██╗  ██╗ ██╗     ██████╗     ').padStart(81).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#0cf73f').bold('██║ ██╔╝ ██║     ██╔══██╗    ').padStart(81).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#0cf73f').bold('█████╔╝  ██║     ██████╔╝    ').padStart(81).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#0cf73f').bold('██╔═██╗  ██║     ██╔══██╗    ').padStart(81).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#0cf73f').bold('██║  ██╗ ███████╗██████╔╝    ').padStart(81).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#0cf73f').bold('╚═╝  ╚═╝ ╚══════╝╚═════╝     ').padStart(81).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.bgHex('#00ffff').bold('').padEnd(69)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#ff6f00').bold('██████╗  █████╗ ██████╗ ████████╗██╗  ██╗███████╗███████╗').padStart(95).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#ff6f00').bold('██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██║  ██║██╔════╝╚══███╔╝').padStart(95).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#ff6f00').bold('██████╔╝███████║██████╔╝   ██║   ███████║█████╗    ███╔╝ ').padStart(95).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#ff6f00').bold('██╔══██╗██╔══██║██╔══██╗   ██║   ██╔══██║██╔══╝   ███╔╝  ').padStart(95).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#ff6f00').bold('██████╔╝██║  ██║██║  ██║   ██║   ██║  ██║███████╗███████╗').padStart(95).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#ff6f00').bold('╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝').padStart(95).padEnd(100)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.bgHex('#00ffff').bold('').padEnd(69)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.hex('#f0ec02').bold(
    `   WELCOME TO YOUR BACKEND SERVER - MADE BY ${chalk
      .hex('#ff0000')
      .bold(chalk.underline(`${linkedName}`))
      .padEnd(118)}`,
  )}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' ███')}${chalk.bgHex('#00ffff').bold('').padEnd(69)}${chalk.bgHex('##ff6f00').white('█')}
${chalk.bgHex('#91f70c').white(' █████████████████████████████████████████████████████████████████████████')}
`;
  console.log(banner);

  // ==== ENHANCED APPLICATION SECTION ====
  const appHeader =
    chalk.hex('#3498db')('┌─── ') +
    chalk.hex('#e74c3c').bold('APPLICATION DETAILS') +
    chalk.hex('#3498db')(' ────────────────────────────────────┐');
  const appFooter = chalk.hex('#3498db')(
    '└────────────────────────────────────────────────────────────┘',
  );

  console.log(appHeader);
  console.log(
    chalk.hex('#3498db').bold('│') +
      chalk.hex('#f39c12').bold(' ◆ Name:    ') +
      chalk.hex('#2ecc71')(envs.APP_NAME).padEnd(71) +
      chalk.hex('#3498db').bold('│'),
  );
  console.log(
    chalk.hex('#3498db').bold('│') +
      chalk.hex('#f39c12').bold(' ◆ Description:    ') +
      chalk.hex('#2ecc71')(envs.APP_DESCRIPTION).padEnd(64) +
      chalk.hex('#3498db').bold('│'),
  );
  console.log(
    chalk.hex('#3498db').bold('│') +
      chalk.hex('#f39c12').bold(' ◆ Author:    ') +
      chalk.hex('#2ecc71')(envs.APP_AUTHOR).padEnd(69) +
      chalk.hex('#3498db').bold('│'),
  );
  console.log(
    chalk.hex('#3498db').bold('│') +
      chalk.hex('#f39c12').bold(' ◆ License:    ') +
      chalk.hex('#2ecc71')(envs.APP_LICENSE).padEnd(68) +
      chalk.hex('#3498db').bold('│'),
  );
  console.log(
    chalk.hex('#3498db').bold('│') +
      chalk.hex('#f39c12').bold(' ◆ Version:    ') +
      chalk.hex('#e67e22').bold(envs.APP_VERSION).padEnd(77) +
      chalk.hex('#3498db').bold('│'),
  );
  console.log(
    chalk.hex('#3498db').bold('│') +
      chalk.hex('#f39c12').bold(' ◆ Environment:    ') +
      chalk
        .hex(
          envs.NODE_ENV === 'production'
            ? '#27ae60'
            : envs.NODE_ENV === 'development'
              ? '#f39c12'
              : '#95a5a6',
        )
        .bold(envs.NODE_ENV.toUpperCase())
        .padEnd(73) +
      chalk.hex('#3498db').bold('│'),
  );
  console.log(
    chalk.hex('#3498db').bold('│') +
      chalk.hex('#f39c12').bold(' ◆ Database:    ') +
      chalk.hex('#3498db').bold(envs.DB_TYPE.toUpperCase()).padEnd(76) +
      chalk.hex('#3498db').bold('│'),
  );
  console.log(appFooter);

  //* ==== SYSTEM INFO ==== **********************************************************************************************************************************************************
  console.log(runtimeHeader);
  console.log(
    chalk.hex('#8e44ad').bold('│') +
      chalk.hex('#1abc9c').bold(' ◈ Timezone:    ') +
      chalk.hex('#ecf0f1')(timezone).padEnd(68) +
      chalk.hex('#8e44ad').bold('│'),
  );
  console.log(
    chalk.hex('#8e44ad').bold('│') +
      chalk.hex('#1abc9c').bold(' ◈ Process ID:    ') +
      chalk.hex('#ecf0f1')(process.pid.toString()).padEnd(66) +
      chalk.hex('#8e44ad').bold('│'),
  );
  console.log(
    chalk.hex('#8e44ad').bold('│') +
      chalk.hex('#1abc9c').bold(' ◈ Memory:    ') +
      chalk
        .hex('#ecf0f1')(memoryUsage + ' MB')
        .padEnd(70) +
      chalk.hex('#8e44ad').bold('│'),
  );
  console.log(
    chalk.hex('#8e44ad').bold('│') +
      chalk.hex('#1abc9c').bold(' ◈ Node.js:    ') +
      chalk.hex('#ecf0f1')(process.version).padEnd(69) +
      chalk.hex('#8e44ad').bold('│'),
  );
  console.log(
    chalk.hex('#8e44ad').bold('│') +
      chalk.hex('#1abc9c').bold(' ◈ Platform:    ') +
      chalk.hex('#ecf0f1')(process.platform).padEnd(68) +
      chalk.hex('#8e44ad').bold('│'),
  );
  console.log(
    chalk.hex('#8e44ad').bold('│') +
      chalk.hex('#1abc9c').bold(' ◈ Logs Path:    ') +
      chalk
        .hex('#ecf0f1')
        .italic(process.cwd() + '/logs')
        .padEnd(76) +
      chalk.hex('#8e44ad').bold('│'),
  );
  console.log(runtimeFooter);

  // ***************************************************************************************************************************************************************

  const gradient = (text: string, colors: string[]) => {
    let result = '';
    const step = Math.floor(text.length / colors.length);
    for (let i = 0; i < text.length; i++) {
      const colorIndex = Math.min(Math.floor(i / step), colors.length - 1);
      result += chalk.hex(colors[colorIndex])(text[i]);
    }
    return result;
  };

  //* ==== DYNAMIC TIMESTAMP ==== ***************************************************************************************************************************************************************
  const timestamp = new Date().toLocaleString('fr-FR', {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  console.log(topBorder);
  console.log(
    sideBorder +
      chalk.bgHex('#2c3e50').white('                                                       ') +
      sideBorder,
  );
  console.log(
    sideBorder +
      chalk.bgHex('#2c3e50')(`                  ${gradient(serverText, gradientColors)}        `) +
      chalk.bgHex('#2c3e50').white('          ') +
      sideBorder,
  );
  console.log(
    sideBorder +
      chalk
        .bgHex('#2c3e50')
        .hex('#00d4ff')
        .bold('           STARTED ON ' + timestamp) +
      chalk.bgHex('#2c3e50').white('          ') +
      sideBorder,
  );
  console.log(
    sideBorder +
      chalk.bgHex('#2c3e50').white('                                                       ') +
      sideBorder,
  );
  console.log(bottomBorder);

  // ***************************************************************************************************************************************************************

  // console.log(topBorder);
  // console.log(bottomBorder);

  // ***************************************************************************************************************************************************************

  console.log('\n');
};
