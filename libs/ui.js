/**
 * 插件UI框架
 */

const WIN = require('ui/window');
const LANG = require('../language/');
const LANG_T = antSword['language']['toastr'];
const PATH = require('path');

class UI {
  constructor(opt) {
    if(antSword.storage("isDev") != "1"){
        toastr.error("请先前往「插件市场」开启开发模式", LANG_T['error']);
        return {
            onStart: (func) => {},
            onAbout: () => {}
        }
    }
    this.categorymap = {
        "default": "默认",
        "Information": "信息获取",
        "Intranet": "内网工具",
        "Datamanager": "数据管理",
        "Support": "辅助工具",
        "NetTool": "网络工具",
        "Cracker": "破解类",
    }
    // 创建一个window窗口
    this.win = new WIN({
      title: `${LANG['title']}`,
      height: 428,
      width: 488,
    });
    this.createMainLayout();
    return {
      onCreate: (func) => {
        this.bindToolbarClickHandler(func);
      },
      onAbout: () => {}
    }
  }

  createMainLayout() {
    let layout = this.win.win.attachLayout('1C');
    layout.cells('a').hideHeader();
    layout.cells('a').setText(`<i class="fa fa-cogs"></i> ${LANG['title']}`);
    // 创建toolbar
    this.createToolbar(layout.cells('a'));
    // 创建form
    this.createForm(layout.cells('a'));

    this.layout = layout;
  }

  /**
   * 创建工具栏
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createToolbar(cell) {
    let toolbar = cell.attachToolbar();
    toolbar.loadStruct([
      { id: 'create', type: 'button', text: LANG['toolbar']['create'], icon: 'plus-circle' },
      { id: 'doc', type: 'button', text: LANG['toolbar']['doc'], icon: 'book' },
      { id: 'about', type: 'button', text: LANG['toolbar']['about'], icon: 'star' },
    ]);
    this.toolbar = toolbar;
  }

  /**
   * 创建表单
   * @param  {Object} cell [description]
   * @return {[type]}      [description]
   */
  createForm(cell) {
    let self=this;
    let formdata=[
      { type: 'settings', position: 'label-left', labelWidth: 100, inputWidth: 270, }, 
      { type: 'block', inputWidth: 'auto', offsetTop: 12, list: [
        { type: 'label', label: LANG['form']['title'], labelWidth: 'auto' },
        { type: 'block', width:'auto', list: [
          { type: 'input', label: LANG['form']['name'], name: 'name', required: true, validate:"NotEmpty", value: "",},
          { type: 'input', label: LANG['form']['name_en'], name: 'name_en', required: true, value: "",},
          { type: 'input', label: LANG['form']['description'], name: 'description',required: true,value: "",},
          { type: 'input', label: LANG['form']['description_en'], name: 'description_en', required: true, value: "",},
          {
            type: 'combo', label: LANG['form']['category'], name: 'category',
            options:(()=>{
                let ret = [];
                let lang = antSword['storage']('language',false,navigator.language.substr(0,2));
                Object.keys(self.categorymap).map((_)=>{
                    ret.push({
                        value: _,
                        text: lang == "zh" ? self.categorymap[_] : _,
                    });
                });
                return ret;
            })(),
          },
        ]},
        {type: 'block', width:'auto', list: [
          { type: 'label', label: `${LANG['form']['icon']}`,},
          { type: 'newcolumn',},
          { type:'button',value: `${LANG['form']['chooseicon']}`, name: 'chooseicon', offsetLeft:'auto',},
          { type: 'newcolumn',},
          { type: 'label', label: `${LANG['form']['selectedicon']} <i class="fa fa-eye fa-2x"></i>`, name: 'selectedicon',},
          { type: 'newcolumn',},
          { type: "hidden", name:"icon", value: "eye",},
        ]}, 
        {type: 'block', width:'auto', list: [
            { type: 'label', label: LANG['form']['multiple']},
            { type: 'newcolumn',},
            { type: "radio", offsetLeft:'auto', name: "multiple", label: "No", labelWidth: 30, position: "label-right", value: false, checked: true },
            { type: "newcolumn" },
            {type: "radio", name: "multiple", label: "Yes", labelWidth: 30, position: "label-right", value: true, }
        ]},
        {type: 'block', width:'auto', list: [
          { type: 'label', label: LANG['form']['scripts'],},
          { type: "newcolumn"},
          { type: "checkbox", offsetLeft:'auto', name: "scripts[0]", label: "PHP", labelWidth: 30, position: "label-right", checked: true, value: "php",},
          { type: "newcolumn"},
          { type: "checkbox", name: "scripts[1]", label: "ASP", labelWidth: 30, position: "label-right", value: "asp",},
          { type: "newcolumn" },
          { type: "checkbox", name: "scripts[2]", label: "ASPX", labelWidth: 30, position: "label-right", value: "aspx",},
          { type: "newcolumn"},
          { type: "checkbox", name: "scripts[3]", label: "CUSTOM", labelWidth: 60, position: "label-right", value: "custom",},
        ]},
        // 其它配置
      ]
    }];
    let form = cell.attachForm(formdata, true);
    form.enableLiveValidation(true);

    form.attachEvent("onButtonClick", (name, e) => {
      switch (name) {
        case 'chooseicon':
        self.showIcons((txt)=>{
          form.setItemValue('icon', txt);
          form.setItemLabel("selectedicon",`${LANG['form']['selectedicon']} <i class="fa fa-${txt} fa-2x"></i>`);
        });
        break;
        default:
        break;
      }
    });

    form.attachEvent("onInfo", (name, e) => {
      var tips_popup;
      if(tips_popup == null){
        tips_popup = new dhtmlXPopup({mode: "bottom"});
        tips_popup.attachHTML(
          "<div style='width:300px;'>" +
          this.form.getUserData(name, "info") +
          "</div>");
        var t = e.target || e.srcElement;
        var x = window.dhx4.absLeft(t);
        var y = window.dhx4.absTop(t);
        var w = t.offsetWidth;
        var h = t.offsetHeight;
        tips_popup.show(x,y,w,h);
      }
    });
    
    this.form = form;
  }

  showIcons(callback) {
    let self = this;
    let icon_lists = require('./icon');
    let win = new WIN({
      title: `choose icon`,
    });
    win.win.maximize();
    let toolbar = win.win.attachToolbar();
    toolbar.loadStruct([
      { id: 'choose', type: 'button', text: LANG['toolbar']['choose'], icon: 'check', enabled: false, }
    ]);
    let dataview = win.win.attachDataView({
      container:"icon_container",
      drag: false, 
      select: true,
      type: {
        template: "<div style='display: flex;flex-direction: column;align-items: center;justify-content: space-around;width: 50px;height: 50px;'><i class='fa fa-#icon# fa-lg'></i><span style='overflow: hidden;text-overflow: ellipsis;white-space: nowrap;width: 50px;text-align: center;'>#icon#</span></div>",
        height: 50,
        width: 50,
      }
    });
    let dataview_data = [];
    icon_lists.forEach((v)=>{
      dataview_data.push({icon: v});
    })
    dataview.parse(dataview_data, 'json');
    
    dataview.attachEvent('onSelectChange', (sel)=>{
      toolbar.enableItem('choose');
    });

    toolbar.attachEvent('onClick', (id)=>{
      switch(id){
        case 'choose':
        var obj = dataview.get(dataview.getSelected());
        if (obj.hasOwnProperty('icon')){
          toastr.success(LANG['chooseicon']['success'], LANG_T['success']);
          callback(obj.icon);
          win.close();
        }else{
          toastr.warning(LANG['chooseicon']['notselect'], LANG_T['warning']);
        }
        break;
        default:
        break;
      }
    });
  }

  /**
   * 监听创建按钮点击事件
   * @param  {Function} callback [description]
   */
  bindToolbarClickHandler(callback) {
    let self = this;
    this.toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'create':
          if(self.form.validate()){
            // 加载中
            self.win.win.progressOn();
            // 获取FORM表单
            let formvals = self.form.getValues();
            let _scripts = [];
            
            // scripts 多选
            for (var i = 0; i < 4; i++) {
              var _data = formvals['scripts['+i+']'];
              if (_data) {
                _scripts.push(_data);
              }
            }
            // 传递给扫描核心代码
            callback({
              package: {
                "name": formvals['name'],
                "name_en": formvals['name_en'],
                "main": "index.js",
                "icon": formvals['icon'],
                "version": '0.1',
                "description": formvals['description'],
                "description_en": formvals['description_en'],
                "author": {
                  "name": "user",
                  "email": "user@u0u.us",
                },
                "category": self.categorymap[formvals['category']],
                "category_en": formvals['category'],
                "multiple": formvals['multiple'],
                "scripts": _scripts,
              },
              // 插件开发目录
              devplugPath: antSword.storage("dev-plugPath", false, PATH.join(remote.process.env.AS_WORKDIR, '.antData/plugins-dev/')),

            }).then((ret) => {
                // 解析扫描结果
                if (ret['status'] == "success") {
                  toastr.success(LANG['success'], LANG_T['success']);
                  // 取消锁定LOADING
                  this.win.win.progressOff();
                  // 文件管理器中打开插件所在目录
                  antSword.shell.showItemInFolder(ret['dir'].replace(/\\/g, "\\\\"));
                  // 重启应用
                  layer.confirm(LANG['confirm']['content'], {
                    icon: 2, shift: 6,
                    title: LANG['confirm']['title']
                  }, (_) => {
                    location.reload();
                  });
                }else{
                  toastr.error(LANG['error'], LANG_T['error']);
                  // 取消锁定LOADING
                  this.win.win.progressOff();
                }
              })
            .catch((err) => {
              toastr.error(antSword.noxss(`${LANG['error']}: ${JSON.stringify(err)}`), LANG_T['error']);
              this.win.win.progressOff();
            });
          }else{
            toastr.warning(LANG['warning'], LANG_T['error']);
          }
          break;
        case 'about':
          antSword['shell'].openExternal("https://github.com/Medicean/create-antsword-plugin");
          break;
        case 'doc':
          antSword['shell'].openExternal("https://doc.u0u.us/zh-hans/plugin_dev/index.html");
        default:
      }
    })
  }
}

module.exports = UI;
