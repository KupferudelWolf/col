///https://discordapp.com/developers/applications/me/387409926907232298

// !col gradient #00000 #FFFF00 #000000     should work like !col gradient #FFFF00 #000000
// !col gradient 4 cloud crow               should work
// !col -g 15 000 00f                       should work

// !col -g -cmy red blue
// !col -g -lab red blue
// !col -g -yuv red blue
// !col -v 0.3

const Discord = require('discord.js');
const logger = require('winston');
const auth = require('./auth.json');
const package = require('./package.json');
const hexColorList = require('./hexColorList.json');
const Jimp = require('jimp');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.login(auth.token);

var isReady = false;
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    if (!isReady) {
      bot.user.setGame('!col -h');
      isReady = true;
    }
});

const inputLIMIT = 100;
bot.on('message', (message) => {
  var msg = "";
  if (message.author.bot) return;
  var isShortHand = message.content.match(/^(#)([0-9A-Fa-f])(\w{2,2}|\w{5,5})\b/g);

  if (message.content.substring(0, 5).toLowerCase() == '!col ' || isShortHand) {
    //const defCol = "36393E";
    var input = message.content;

    if (input.split(' ').length>inputLIMIT) {
      msg = "Sorry! I can only accept a maximum of " + inputLIMIT + " colors. *(You attempted to input " + input.split(' ').length +".)*";
      message.channel.send(msg);
      input = "";
    }

    /// Set preset colors.
    const colsAlts = hexColorList.list;
    for (c in colsAlts) {
      var reg = new RegExp(c,"gi");
      input = input.replace(reg,colsAlts[c]);
    }

    /// Summarize certain commands.
    var args = input
      .replace(/,/g,' ')
      .replace(/  /g,' ')
      .replace(/#/g,'')
      //.replace(/0x/g,'')
      .replace(/[\n\r]+/gi,' ')
      .split(' ')
    ;
    const argsAlts = {
      "help": "h"
    , "hsl": "hsv"
    , "about": "a"
    , "lookup": "a"
    , "o": "v"
    , "online": "v"
    , "grad": "g"
    , "gradient": "g"
    , "version": "v"
    };
    if (args.length>1) {
      for (a in argsAlts)
        if (args[1].toLowerCase()==a || args[1].toLowerCase()=='-'+a) args[1] = "-"+argsAlts[a];
    }
    if (args.length>2)
      if (args[2].toLowerCase()=='help' || args[2].toLowerCase()=='-help') args[2] = '-h';

    /// Respond to special commands.
    switch (args[1]) {
      case "-a":
        if (args[2]=='-h') {
          msg = message.author
            + '\n' + '**Help: Color Lookup**'
            + '\n'
            + '\n' + '`!col -a <color> [-e] [-all]`'
            + '\n'
            + '\n' + 'Examples:'
            + '\n' + '```!col -a #DC143C```'
            + '\n' + 'Displays information about a color, including RGB, HSV, and CMYK values.'
            + '\n'
            + '\n' + '`Attributes:'
            + '\n' + '  -e        (optional)  Display values as floating point numbers.'
            + '\n' + '  -all      (optional)  Convert color to all available color spaces.`'
          ;
          message.channel.send(msg);
          break;
        }
        var cols = returnColors(args);
        for (i in args) args[i] = args[i].toLowerCase();
        if (cols.length>0) {
          getColorInfo(cols[0],true,args[3]=='-e',(args[3]=='-all'||args[4]=='-all'));
        } else {
          msg = "Please specify a valid color. *(If you can't decide one one, try `!col -a rand`!)*";
          message.channel.send(msg);
        }
        break;
      case "-h":
        msg = message.author
          + '\n' + '**Help**'
          + '\n'
          + '\n' + 'Hello! I return color swatches based on the colors you give me!'
          + '\n' + 'I was created by '+package.author+' on '+package.timestamp+'.'
          + '\n'
          + '\n' + '`Here are my available commands:'
          + '\n'
          + '\n' + 'COMMAND   TAG  DESCRIPTION'
          + '\n' + '-------------------------------------------------'
          + '\n' + 'color          Posts a swatch of your colors.'
          + '\n' + 'about     -a   Returns information about a color.'
          + '\n' + 'gradient  -g   Creates a gradient of your colors.'
          + '\n' + 'help      -h   Displays help documentation.'
          + '\n' + 'online    -o   Pings the bot.'
          + '\n' + 'version   -v   Displays version information.`'
          + '\n'
          + '\n' + 'Type `!col <command>` or `!col <tag>` to run that action.'
          + '\n'
          + '\n' + 'Type `!col <command> help` or `!col <tag> -h` to learn about a specific command.'
          + '\n'
          + '\n' + 'Still confused? Try: `!col color -h`'
        ;
        if (args.length>2) {
          switch (args[2]) {
            case 'rand':
              msg = message.author
                + '\n' + '**Help: Random Color**'
                + '\n'
                + '\n' + '`!col rand[(modifiers)]`'
                + '\n'
                + '\n' + 'Examples:'
                + '\n' + '```!col rand'
                + '\n' + '!col rand(rgb)'
                + '\n' + '!col rand(h=10;s=0.2)'
                + '\n' + '!col -g rand rand```'
                + '\n' + 'Creates a gradient from the first color to the second.'
                + '\n'
                + '\n' + '`Modifiers:'
                + '\n' + '  rgb   (DEFAULT)   Creates a color by generating a number 0 to 16777215.'
                + '\n' + '  hsv               Creates a color by generating the hue, saturation, and value individually.'
                + '\n' + '  hsv()             Creates a color within the given guidelines.`'
                + '\n'
                + '\n' + 'The `hsv()` modifier may contain the following modifiers:'
                + '\n' + '`h=##     Hue (from 0 to 360)'
                + '\n' + 's=##     Saturation (from 0 to 1)'
                + '\n' + 'v=##     Value/Lightness (from 0 to 1)`'
                + '\n' + 'Modifiers must be seperated with a semicolon (`;`).'
              ;
              break;
          }
        }
        message.channel.send(msg);
        break;
      case "-v":
        if (args[2]=='-h') {
          msg = message.author
            + '\n' + '**Help: Version**'
            + '\n'
            + '\n' + '`!col <-o>/<-v>`'
            + '\n'
            + '\n' + 'Examples:'
            + '\n' + '```!col -v'
            + '\n' + '!col online```'
            + '\n' + 'Displays the version and update notes for this bot.'
          ;
          message.channel.send(msg);
          break;
        }
        var verShort = package.version.split('.');
        verShort = verShort[0] + "." + verShort[1];
        msg = '@here Version '+package.version+' of '+package.name+' is online! :rainbow:'
          + '\n'
          + '\n' + 'Update Notes:';
        var updates = package.update_notes;
        for (i in updates[verShort]) msg += '\n` > ' + updates[verShort][i] + '`';
        message.channel.send(msg);
        break;
      case "-g":
        if (args[2]=='-h') {
          msg = message.author
            + '\n' + '**Help: Gradient**'
            + '\n'
            + '\n' + '`!col -g [numColors] [mode] <color> <color>`'
            + '\n'
            + '\n' + 'Examples:'
            + '\n' + '```!col gradient #E50017 #00BFAC'
            + '\n' + '!col -g 7 -rgb red blue```'
            + '\n' + 'Creates a gradient from the first color to the second.'
            + '\n'
            + '\n' + '`Attributes:'
            + '\n' + '  numColors (optional)  Set how many colors the gradient should include.'
            + '\n' + '  mode      (optional)  Set how the generator calculates the gradient.'
            + '\n' + '  color                 A color. Type "!col color -h" for more info.`'
            + '\n'
            + '\n' + '[mode] may be any of the following:'
            + '\n' + '`-rgb     RGB value based gradient (DEFAULT)'
            + '\n' + '-hsv     Hue-Saturation-Value based gradient (through blue)'
            + '\n' + '-inv     Hue-Saturation-Value based gradient (through red)'
            + '\n' + '-all     One gradient for each mode`'
          ;
          message.channel.send(msg);
          break;
        }
        generateGradient(args);
        break;
      default:
        if (args.length>2) {
          if (args[1].toLowerCase()=='color' && args[2]=='-h') {
            msg = message.author
              + '\n' + '**Help: Color**'
              + '\n'
              + '\n' + '`!col <color> [color] [color]...`'
              + '\n'
              + '\n' + 'Examples:'
              + '\n' + '```!col #0000FF'
              + '\n' + '!col 0000ff'
              + '\n' + '!col 0x0000ff'
              + '\n' + '!col 0xff'
              + '\n' + '!col 00f'
              + '\n' + '!col blue'
              + '\n' + '!col hsv(h=240;s=1;v=1)'
              + '\n' + '!col hsv(240;1;1)'
              + '\n' + '#0000ff'
              + '\n' + '#00f'
              + '\n' + '#00f'
              + '\n' + '!col ffa f6bfaa #ee80aa E641AA de02ab'
              + '\n' + '#FF0000 #00FF00 #0000FF```'
              + '\n' + 'Creates a swatch of the input colors as a PNG image.'
              + '\n'
              + '\n' + '`Attributes:'
              + '\n' + '  color               Any number of colors seperated by spaces or commas.`'
              + '\n'
              + '\n' + '<color> may be in any of the following formats (case insensitive):'
              + '\n' + '`#FF0000'
              + '\n' + 'FF0000'
              + '\n' + '0xFF0000'
              + '\n' + '#F00'
              + '\n' + 'F00'
              + '\n' + 'HSV(h=240;s=1;v=1)'
              + '\n' + 'HSV(240;1;1)'
              + '\n' + 'RED'
              + '\n' + 'RAND`' + " (Type `!col -h rand` for more details.)";
              + '\n'
              + '\n' + 'The `!col` prefix is not required if the first color starts with `#`.'
            ;
            message.channel.send(msg);
            break;
          }
        }
        /// Build the input colors.
        buildImage(returnColors(args));
        break;
      }




      //
    }




  function clamp(n,low,high) {
    return Math.min(Math.max(n,low),high);
  }
  function hex_to_RGB(hex) {
    /// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF").
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.toString().replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  function RGB_to_HSV(rgbObj) {
    var color = {
      'r': rgbObj.r/255,
      'g': rgbObj.g/255,
      'b': rgbObj.b/255
    };
    var minRGB = Math.min(color.r,Math.min(color.g,color.b));
    var maxRGB = Math.max(color.r,Math.max(color.g,color.b));
    /// Check if the input is greyscale.
    if (minRGB==maxRGB) {
      return {
        'h': 0,
        's': 0,
        'v': minRGB
      };
    } else {
      var d = (color.r==minRGB) ?
        color.g-color.b :
        ((color.b==minRGB) ? color.r-color.g : color.b-color.r);
      var hue = (color.r==minRGB) ? 3 : ((color.b==minRGB) ? 1 : 5);
      hue = 60*(hue - d/(maxRGB - minRGB));
      var sat = (maxRGB - minRGB)/maxRGB;
      var val = maxRGB;
      return {
        'h': hue,
        's': sat,
        'v': val
      };
    }
  }
  function HSV_to_RGB(hsvObj) {
    var red, grn, blu;
    var i = Math.floor(hsvObj.h/360 * 6);
    var f = hsvObj.h/360 * 6 - i;
    var p = hsvObj.v * (1 - hsvObj.s);
    var q = hsvObj.v * (1 - f * hsvObj.s);
    var t = hsvObj.v * (1 - (1 - f) * hsvObj.s);
    switch (i % 6) {
        case 0: red = hsvObj.v, grn = t, blu = p; break;
        case 1: red = q, grn = hsvObj.v, blu = p; break;
        case 2: red = p, grn = hsvObj.v, blu = t; break;
        case 3: red = p, grn = q, blu = hsvObj.v; break;
        case 4: red = t, grn = p, blu = hsvObj.v; break;
        case 5: red = hsvObj.v, grn = p, blu = q; break;
    }
    return {
        'r': Math.round(red * 255),
        'g': Math.round(grn * 255),
        'b': Math.round(blu * 255)
    };
  }
  function RGB_to_CMYK(rgbObj) {
    var cyan, mgnt, yllw, kblk;

    var r = rgbObj.r;
    var g = rgbObj.g;
    var b = rgbObj.b;

    // BLACK
    if (r==0 && g==0 && b==0) {
      c = 0;
      m = 0;
      y = 0;
      k = 1;
    } else {
      c = 1 - (r/255);
      m = 1 - (g/255);
      y = 1 - (b/255);

      var minCMY = Math.min(c, Math.min(m,y) );
      c = (c - minCMY) / (1 - minCMY) ;
      m = (m - minCMY) / (1 - minCMY) ;
      y = (y - minCMY) / (1 - minCMY) ;
      k = minCMY;
    }

    return {'c':c,'m':m,'y':y,'k':k};
  }
  function RGB_to_LAB(rgbObj) {
    var r = rgbObj.r / 255;
    var g = rgbObj.g / 255;
    var b = rgbObj.b / 255;
    var x, y, z;

    r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
    y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
    z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

    return {
      'L': (116 * y) - 16,
      'A': 500 * (x - y),
      'B': 200 * (y - z)
    };
  }
  function RGB_to_YUV(rgbObj) {
    var r = rgbObj.r;
    var g = rgbObj.g;
    var b = rgbObj.b;

    var y = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    var u = Math.round((((b - y) * 0.493) + 111) / 222 * 255);
    var v = Math.round((((r - y) * 0.877) + 155) / 312 * 255);
    return {'Y':y,'U':u,'V':v};
  }
  function YUV_to_RGB(yuvObj){
    var y = yuvObj.Y;
    var u = yuvObj.U;
    var v = yuvObj.V;
    var r = clamp(Math.floor(y+1.4075*(v-128)),0,255);
    var g = clamp(Math.floor(y-0.3455*(u-128)-(0.7169*(v-128))),0,255);
    var b = clamp(Math.floor(y+1.7790*(u-128)),0,255);
    return {'r':r,'g':g,'b':b};
  }


  function returnColors(args) {
    var cols = [];
    const hexREG = new RegExp("^([0-9A-Fa-f])+$","g");
    for (i in args) {
      if (args[i].substring(0,2).toLowerCase()=='0x' && args[i].length<=8) {
        args[i] = args[i].replace(/0x/gi,'000000');
        args[i] = args[i].substring(args[i].length-6);
      }
      if (args[i].match(hexREG) && args[i].length <= 6) cols.push(args[i]);
      if (args[i].substring(0,4).match(/RAND/gi)) {
        if (args[i][4]!='(') args[i] += '(rgb)';
        var argsRand = args[i].replace(/RAND\(/gi,'').replace(/\)/g,'').replace(/ /g,'').split(';');
        var rand_color = {
            'h': Math.random()*360
          , 's': Math.random()
          , 'v': Math.random()
        };
        if (argsRand[0].match(/rgb/gi)) {
          cols.push(Math.floor(Math.random()*16777215).toString(16));
        } else {
          var nR_RGB;
          for (j in argsRand) {
            var newRandColVal = argsRand[j].replace(/=/g,'').substring(1) - 0;
            switch (argsRand[j][0]) {
              case 'h':
                if (newRandColVal>=0 && newRandColVal<360) rand_color.h = newRandColVal;
                break;
              case 's':
                if (newRandColVal>=0 && newRandColVal<=1) rand_color.s = newRandColVal;
                break;
              case 'v':
                if (newRandColVal>=0 && newRandColVal<=1) rand_color.v = newRandColVal;
                break;
            }
            nR_RGB = HSV_to_RGB(rand_color);
          }
          var out = '';
          for (j in nR_RGB) {
            if (nR_RGB[j]<16) out += '0';
            out += nR_RGB[j].toString(16)
          }
          cols.push(out);

          //
        }
        //for (j in argsHSV) console.log(argsHSV[j]);

      }
      if (args[i].substring(0,4).match(/HSV\(/gi)) {
        var newHSVcolor = {};
        var argsHSV = args[i].replace(/HSV\(/gi,'').replace(/\)/g,'').replace(/ /g,'').split(';');
        for (j in argsHSV) {
          var nR_RGB;
          if (isNaN(argsHSV[j])) {
            var newColVal = argsHSV[j].replace(/=/g,'').substring(1) - 0;
            switch (argsHSV[j][0]) {
              case 'h':
                if (newColVal>=0 && newColVal<360) newHSVcolor.h = newColVal;
                break;
              case 's':
                if (newColVal>=0 && newColVal<=1) newHSVcolor.s = newColVal;
                break;
              case 'v':
                if (newColVal>=0 && newColVal<=1) newHSVcolor.v = newColVal;
                break;
            }
          } else {
            switch (j) {
              case '0':
                if (argsHSV[j]>=0 && argsHSV[j]<360) newHSVcolor.h = argsHSV[j];
                break;
              case '1':
                if (argsHSV[j]>=0 && argsHSV[j]<=1) newHSVcolor.s = argsHSV[j];
                break;
              case '2':
                if (argsHSV[j]>=0 && argsHSV[j]<=1) newHSVcolor.v = argsHSV[j];
                break;
            }
          }
        }
        if (Object.keys(newHSVcolor).length==3) {
          nR_RGB = HSV_to_RGB(newHSVcolor);
          var out = '';
          for (j in nR_RGB) {
            if (nR_RGB[j]<16) out += '0';
            out += nR_RGB[j].toString(16)
          }
          cols.push(out);
        }
      }
    }
    for (i in cols) {
      /// Make sure the color is six digits long.
      if (cols[i].length==1) {
        cols[i] = cols[i]+cols[i]+cols[i];
        cols[i] = cols[i]+cols[i];
      }
      if (cols[i].length==2) {
        cols[i] = cols[i]+cols[i]+cols[i];
      }
      if (cols[i].length==3) {
        var temp = "";
        for (var j=0; j<3; j++) {
          temp += cols[i][j] + cols[i][j];
        }
        cols[i] = temp;
      }
      while (cols[i].length<6) {
        cols[i] += "0";
      }
    }
    return cols;
  }


  function generateGradient(args) {
    const numSqDEF = '5';
    const modeDEF = '-rgb';
    const cRANGE = [3,20];
    var hasCount = false;
    var hasMode = false;
    if (args.length > 4) {
      if (args[2].replace(/^[-]/g,'').length==3) hasMode = true;
        else if (!isNaN(args[2]) && args[2]<100) hasCount = true;
      if (hasCount) {
        if (args[3].replace(/^[-]/g,'').length==3) hasMode = true;
          //else if (!isNaN(args[3]) && args[3]<100) hasMode = true;
        if (args[3][0]!='-' && isNaN(args[3])) args[3] = '-' + args[3];
      }
    }

    if (!hasCount) args.splice(2,0,numSqDEF);
    if (!hasMode) args.splice(3,0,modeDEF);
    args = args.slice(0,4).concat(returnColors(args.slice(4)));

    if (args.length>=6) {
      var numSquares = Math.min(Math.max(Math.abs(args[2]),cRANGE[0]),cRANGE[1]);
      var mode = args[3];
      switch (mode) {
        case '-rgb': mode = 0; break;
        case '-hsv': mode = 1; break;
        case '-inv': mode = 2; break;
        case '-all': mode = 3; break;
        default: mode = 0; break;
      }

      var numIterations = mode==3 ? 3 : 1;
      for (var iter=0; iter<numIterations; iter++) {
        var cols = [];
        if (numIterations>1) mode = iter;
        for (var i=0; i<numSquares; i++) {
          var val = i/(numSquares-1);
          var new_color = "";
          var prog = [];
          for (var j=0; j<2; j++) prog[j] = hex_to_RGB(args[j+4]);
          switch (mode) {
            case 0:
              /// RGB Gradient
              var col_val;
              for (ch in prog[0]) {
                col_val = Math.round(val*(prog[1][ch]-prog[0][ch])+prog[0][ch]);
                if (col_val<16) new_color += "0";
                new_color += col_val.toString(16);
              }
              break;
            case 1:
              /// HSV Gradient
              for (j in prog) prog[j] = RGB_to_HSV(prog[j]);
              var col_val = {'h':0,'s':0,'v':0};
              for (ch in col_val) {
                col_val[ch] = val*(prog[1][ch]-prog[0][ch])+prog[0][ch];
              }
              hue_val = HSV_to_RGB(col_val);
              for (ch in hue_val) {
                if (hue_val[ch]<16) new_color += "0";
                new_color += hue_val[ch].toString(16);
              }
              break;
            case 2:
              /// HSV Gradient (Inverted)
              for (j in prog) prog[j] = RGB_to_HSV(prog[j]);
              var col_val = {'h':0,'s':0,'v':0};
              prog[1].h += 360;
              for (ch in col_val) {
                col_val[ch] = val*(prog[1][ch]-prog[0][ch])+prog[0][ch];
                if (col_val[ch]>=360) col_val[ch] -= 360;
              }
              hue_val = HSV_to_RGB(col_val);
              for (ch in hue_val) {
                if (hue_val[ch]<16) new_color += "0";
                new_color += hue_val[ch].toString(16);
              }
              break;
          }
          cols.push(new_color);
        }

        msg = message.author + "'s ";
        switch (mode) {
          case 0: msg += "RGB Gradient"; break;
          case 1: msg += "HSV Gradient"; break;
          case 2: msg += "HSV Gradient (Inverted)"; break;
        }
        msg += ':\n';
        for (j in cols) msg += "#" + cols[j] + ", ";

        buildImage(cols,msg,iter,false);
      }
      //
    }
  }


  function getColorInfo(color,sendMessage,exact,extended) {
    var masterObj = {'hex' : color.toLowerCase()}; /// {hex,name,r,g,b,h,s,v,c,m,y,k,L,A,B,Y,U,V}

    const colsAlts = hexColorList.list;
    var hexName = '#'+masterObj.hex.toUpperCase();
    for (c in colsAlts) {
      var reg = new RegExp(colsAlts[c],"gi");
      if (hexName.match(reg)) masterObj.name = c.toLowerCase();
    }
    if (masterObj.name) {
      var n = masterObj.name.split(' ');
      for (i in n) n[i] = n[i][0].toUpperCase() + n[i].substring(1);
      masterObj.name = n.join(' ');
    }

    var rgbObj = hex_to_RGB(color);
    var hsvObj = RGB_to_HSV(rgbObj);
    var cmykObj = RGB_to_CMYK(rgbObj);
    var labObj = RGB_to_LAB(rgbObj);
    var yuvObj = RGB_to_YUV(rgbObj);
    for (i in rgbObj) masterObj[i] = rgbObj[i];
    for (i in hsvObj) masterObj[i] = hsvObj[i];
    for (i in cmykObj) masterObj[i] = cmykObj[i];
    for (i in labObj) masterObj[i] = labObj[i];
    for (i in yuvObj) masterObj[i] = yuvObj[i];

    if (sendMessage) {
      var dec = exact ? 0 : 100000;
      var prec = function(x,d) { return d==0 ? x : Math.round(x*d)/d };

      var msg = message.author + '\n\n' + '**Color';
      if (masterObj.name) msg += ': ' + masterObj.name;
        else if (masterObj.hex) msg += ': ' + masterObj.hex;
      msg += '**\n';
      if (masterObj.r!=undefined && masterObj.g!=undefined && masterObj.b!=undefined) {
        msg += '\nRGB:\n```';
        msg += 'Hex:   ' + hexName + '\n';
        msg += 'Red:   ' + masterObj.r + '/255 (' + prec(masterObj.r/255,dec) + '/1)\n';
        msg += 'Green: ' + masterObj.g + '/255 (' + prec(masterObj.g/255,dec) + '/1)\n';
        msg += 'Blue:  ' + masterObj.b + '/255 (' + prec(masterObj.b/255,dec) + '/1)```';
      }
      if (masterObj.h!=undefined && masterObj.s!=undefined && masterObj.v!=undefined) {
        msg += '\nHSV:\n```';
        msg += 'Hue:        ' + prec(masterObj.h,dec) + '\xB0\n';
        msg += 'Saturation: ' + prec(masterObj.s*100,dec) + '%\n';
        msg += 'Value:      ' + prec(masterObj.v*100,dec) + '%```';
      }
      if (masterObj.c!=undefined && masterObj.m!=undefined && masterObj.y!=undefined && masterObj.k!=undefined) {
        msg += '\nCMYK:\n```';
        msg += 'Cyan:        ' + prec(masterObj.c*100,dec) + '%\n';
        msg += 'Magenta:     ' + prec(masterObj.m*100,dec) + '%\n';
        msg += 'Yellow:      ' + prec(masterObj.y*100,dec) + '%\n';
        msg += 'Key (Black): ' + prec(masterObj.k*100,dec) + '%```';
      }
      if (extended) {
        if (masterObj.L!=undefined && masterObj.A!=undefined && masterObj.B!=undefined) {
          msg += '\nCIE-L*ab:\n```';
          msg += 'Lightness:       ' + masterObj.L + '\n';
          msg += 'Green-Red (a):   ' + masterObj.A + '\n';
          msg += 'Blue-Yellow (b): ' + masterObj.B + '```';
        }
        if (masterObj.Y!=undefined && masterObj.U!=undefined && masterObj.V!=undefined) {
          msg += '\nY\u2032UV:\n```';
          msg += 'Luma (Y\u2032):      ' + masterObj.Y + '\n';
          msg += 'Horizontal (U): ' + masterObj.U + '\n';
          msg += 'Vertical (V):   ' + masterObj.V + '```';
        }
      }

      buildImage([color],msg);
    }
    return masterObj;
  }


  function buildImage(cols,msg,stream,vertical) {
    if (stream==undefined) stream = '';
    if (vertical==undefined) vertical = true;
    let imageData = [];
    for (i in cols) {
      var hx = hex_to_RGB(cols[i]);
      imageData.push(Jimp.rgbaToInt(hx.r,hx.g,hx.b,255));
    }

    var rectHeight = 100;
    var rectWidth = 100;
    var rectSize = vertical ? [600,rectHeight*imageData.length] : [rectWidth*imageData.length,100];
    let image = new Jimp(rectSize[0], rectSize[1], function (err, image) {
      if (err) throw err;

      for (var x=0; x<rectSize[0]; x++) {
        for (var y=0; y<rectSize[1]; y++) {
          if (vertical==true) {
            var color = Math.floor(y/rectHeight);
            image.setPixelColor(imageData[color], x, y)
          } else {
            var color = Math.floor(x/rectWidth);
            image.setPixelColor(imageData[color], x, y)
          }
        }
      }

      Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(function (font) {
          image.print(font, 10, 10, "Hello world!");
      });

    });


    /// Return a message if it doesn't find a color.
    if (cols.length==0) {
      if (input.length>0) {
        msg = "Sorry! I didn't find a color.\nType `!col help` if you are lost!";
        message.channel.send(msg);
      }
    } else {
      if (msg=='' || msg==undefined) {
        msg = message.author + ": ";
        for (j in cols) msg += "#" + cols[j] + ", ";
      }
      msg = msg.replace(/(, )$/g,'');
      image.write('./bin/color'+stream+'.png', (err) => {
        if (err) throw err; else {
          message.channel.send(msg, {
            file: './bin/color'+stream+'.png'
          });
        }
      });
    }
  }

});
