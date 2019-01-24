/**
 * 核心模块
 */

const fs = require('fs');
const path = require('path');

class Core {
  constructor(argv) {
    var self = this;
    self.argv = argv;

    return new Promise((res, rej) => {
      self.plugindir = path.join(argv.devplugPath, argv['package']['name_en'].replace(/\s+/g,'').toLowerCase().replace(/[^a-z]/g,''));
      self.createPluginDir();
      self.createGitignore();
      self.createPackage();
      self.createLanguage();
      self.createIndex();
      return res({status: 'success', dir: self.plugindir});
    })
  }

  createPluginDir() {
    var self = this;
    fs.mkdirSync(self.plugindir);
  }

  createLanguage() {
    var self = this;
    fs.mkdirSync(path.join(self.plugindir, 'language/'));
    let lang_index = `'use strict';

const languages = {
  'en': 'English',
  'zh': '简体中文'
}

// 获取本地设置语言（如若没有，则获取浏览器语言
let lang = antSword['storage']('language',
  false,
  navigator.language.substr(0,2)
);

// 判断本地设置语言是否符合语言模板
lang = languages[lang] ? lang : 'en';

// 返回语言模板
let langModule = require(\`./\${lang}\`);
langModule.__languages__ = languages;

module.exports = langModule;
`;
    fs.writeFileSync(path.join(self.plugindir, 'language/index.js'), lang_index);

    let lang_zh = `module.exports = {
  title: "${self.argv.package['name']}",
  success: "操作成功",
  error: "操作失败",
  toolbar: {
    start: "开始",
    reset: "重置",
  },
}
`;
    fs.writeFileSync(path.join(self.plugindir, 'language/zh.js'), lang_zh);
    let lang_en = `module.exports = {
  title: "${self.argv.package['name_en']}",
  success: "success",
  error: "fail",
  toolbar: {
    start: "Start",
    reset: "Reset",
  },
}
`;
    fs.writeFileSync(path.join(self.plugindir, 'language/en.js'), lang_en);
  }

  createGitignore() {
    let self = this;
    let file_data = `.DS_*
`;
    fs.writeFileSync(path.join(self.plugindir, '.gitignore'), file_data);
  }

  createPackage() {
    let self = this;
    let option = $.extend({
      "name": "我的插件",
      "name_en": "My Plugin",
      "main": "index.js",
      "icon": "eye",
      "version": "0.1",
      "description": "我的第一个插件",
      "description_en": "My first AntSword Plugin",
      "author": {
        "name": "user",
        "email": "user@localhost"
      },
      "category": "",
      "category_en": "",
      "multiple": false,
      "scripts": ["php"],
    }, self.argv.package);
    fs.writeFileSync(path.join(self.plugindir, 'package.json'), JSON.stringify(option, null, 2));
  }
  createIndex() {
    let self = this;
    let code = '';
    if (self.argv.package.multiple == false) {
      code = self.getSingleCode();
    }else{
      code = self.getMultiCode();
    }
    fs.writeFileSync(path.join(self.plugindir, 'index.js'), code);
  }

  getSingleCode(){
    let code  = `
'use strict';

const WIN = require('ui/window'); // 窗口库
const tabbar = require('ui/tabbar'); // Tab库
const LANG_T = antSword['language']['toastr']; // 通用通知提示

const LANG = require('./language/'); // 插件语言库
/**
 * 插件类
*/
class Plugin {
  constructor(opt) {
    /**
     * 关于 opt 数据结构详细说明见: https://doc.u0u.us/zh-hans/plugin_dev/api.html
    */
    // ######### 下方是具体插件代码,由插件作者编写 ##########
    
    let self = this;
    // 创建一个 window
    console.log(opt);
    let win = new WIN({
      title: \`\${LANG['title']}-\${opt['ip']}\`,
      height: 428,
      width: 488,
    });
    let default_html = \`<div>
    默认页面, 点击上方 「\${LANG['toolbar']['start']}」按钮即可向 shell 发出请求，获取 WEB 目录, 根目录, uname 和 当前用户
</div>\`;
    win.win.attachHTMLString(default_html);
    
    // 初始化 toolbar
    let toolbar = win.win.attachToolbar();
    toolbar.loadStruct([
        { id: 'start', type: 'button', text: LANG['toolbar']['start'], icon: 'play',}, // 开始按钮
        { id: 'reset', type: 'button', text: LANG['toolbar']['reset'], icon: 'undo',}, // 重置按钮
    ]);
    // 点击事件
    toolbar.attachEvent('onClick', (id)=>{
    switch(id){
      case 'start':
        // 实例化 Shell Core
        let core = new antSword['core'][opt['type']](opt);
        // 向Shell发起请求
        core.request({
          _: self.getPayload(opt['type'])
        }).then((_ret) => { // 处理返回数据
          win.win.attachHTMLString(\`\${default_html}<p>\${opt['url']}</p><p>\${_ret['text']}</p>\`);
          toastr.success(LANG['success'], LANG_T['success']);
        }).catch((err) => { // 处理异常数据
          toastr.error(\`\${LANG['error']}: \${JSON.stringify(err)}\`, LANG_T['error']);
        });
        break;
      case 'reset':
        win.win.attachHTMLString(default_html);
        break;
      default:
        break;
      }
    });
    // ######### 上方是具体插件代码,由插件作者编写 ##########
  }
  
  // 自定义函数,用于获取不同类型的 payload
  getPayload(shelltype){
    let codes = {
      php: '$D=dirname($_SERVER["SCRIPT_FILENAME"]);if($D=="")$D=dirname($_SERVER["PATH_TRANSLATED"]);$R="{$D}\\t";if(substr($D,0,1)!="/"){foreach(range("C","Z")as $L)if(is_dir("{$L}:"))$R.="{$L}:";}else{$R.="/";}$R.="\\t";$u=(function_exists("posix_getegid"))?@posix_getpwuid(@posix_geteuid()):"";$s=($u)?$u["name"]:@get_current_user();$R.=php_uname();$R.="\\t{$s}";echo $R;',
      asp: 'Dim S:SET C=CreateObject("Scripting.FileSystemObject"):If Err Then:S="ERROR:// "&Err.Description:Err.Clear:Else:S=Server.Mappath(".")&chr(9):For Each D in C.Drives:S=S&D.DriveLetter&chr(58):Next:End If:Response.Write(S)',
      aspx: 'var c=System.IO.Directory.GetLogicalDrives();Response.Write(Server.MapPath(".")+"\\t");for(var i=0;i<=c.length-1;i++)Response.Write(c[i][0]+":");Response.Write("\\t"+Environment.OSVersion+"\\t");Response.Write(Environment.UserName);',
      custom: 'A',
    }
    return codes[shelltype];
  }
}

module.exports = Plugin;`;
    return code;
  }
  getMultiCode(){
    return `'use strict';

const WIN = require('ui/window'); // 窗口库
const tabbar = require('ui/tabbar'); // Tab库
const LANG_T = antSword['language']['toastr']; // 通用通知提示

const LANG = require('./language/'); // 插件语言库
/**
 * 插件类
*/
class Plugin {
  constructor(opts) {
    /**
     * 关于 opt 数据结构详细说明见: https://doc.u0u.us/zh-hans/plugin_dev/api.html
     * opts = [opt1, opt2, ..., optn]
    */
    // ######### 下方是具体插件代码,由插件作者编写 ##########
    
    let self = this;
    // 创建一个 window
    let win = new WIN({
      title: \`\${LANG['title']}\`,
      height: 428,
      width: 488,
    });
    
    let grid = win.win.attachGrid();
    grid.setHeader(\`
      &nbsp;,
      URL,
      Result
    \`);
    grid.setColTypes("ro,ro,ro");
    grid.setColSorting('str,str,str');
    grid.setInitWidths("40,150,*");
    grid.setColAlign("center,left,left");
    grid.init();

    // 初始化 toolbar
    let toolbar = win.win.attachToolbar();
    toolbar.loadStruct([
        { id: 'start', type: 'button', text: LANG['toolbar']['start'], icon: 'play',}, // 开始按钮
        { id: 'reset', type: 'button', text: LANG['toolbar']['reset'], icon: 'undo',}, // 重置按钮
    ]);
    // 点击事件
    toolbar.attachEvent('onClick', (id)=>{
    switch(id){
      case 'start':
        grid.clearAll();
        // 遍历所有的 opt 逐一发送 payload
        for (let i = 0; i < opts.length; i++) {
          let opt = opts[i];
          // 实例化 Shell Core
          let core = new antSword['core'][opt['type']](opt);
          // 向Shell发起请求
          core.request({
            _: self.getPayload(opt['type'])
          }).then((_ret) => { // 处理返回数据
            grid.addRow(i, \`\${i},\${opt['url']},\${_ret['text']}\`);
          }).catch((err) => { // 处理异常数据
            grid.addRow(i, \`\${i},\${opt['url']},\${JSON.stringify(err).replace(',','')}\`);
            toastr.error(\`\${opt['url']}-\${LANG['error']}: \${JSON.stringify(err)}\`, LANG_T['error']);
          });
        }
        break;
      case 'reset':
        grid.clearAll();
        break;
      default:
        break;
      }
    });
    // ######### 上方是具体插件代码,由插件作者编写 ##########
  }
  
  // 自定义函数,用于获取不同类型的 payload
  getPayload(shelltype){
    let codes = {
      php: '$D=dirname($_SERVER["SCRIPT_FILENAME"]);if($D=="")$D=dirname($_SERVER["PATH_TRANSLATED"]);$R="{$D}\\t";if(substr($D,0,1)!="/"){foreach(range("C","Z")as $L)if(is_dir("{$L}:"))$R.="{$L}:";}else{$R.="/";}$R.="\\t";$u=(function_exists("posix_getegid"))?@posix_getpwuid(@posix_geteuid()):"";$s=($u)?$u["name"]:@get_current_user();$R.=php_uname();$R.="\\t{$s}";echo $R;',
      asp: 'Dim S:SET C=CreateObject("Scripting.FileSystemObject"):If Err Then:S="ERROR:// "&Err.Description:Err.Clear:Else:S=Server.Mappath(".")&chr(9):For Each D in C.Drives:S=S&D.DriveLetter&chr(58):Next:End If:Response.Write(S)',
      aspx: 'var c=System.IO.Directory.GetLogicalDrives();Response.Write(Server.MapPath(".")+"\\t");for(var i=0;i<=c.length-1;i++)Response.Write(c[i][0]+":");Response.Write("\\t"+Environment.OSVersion+"\\t");Response.Write(Environment.UserName);',
      custom: 'A',
    }
    return codes[shelltype];
  }
}

module.exports = Plugin;
`;
  }
}
  
module.exports = Core;
  