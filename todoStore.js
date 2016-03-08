var github = require('octonode');
var os = require('os');
var ghgist ={}; 
var client ={}; 

/*
module.exports.currentToDo = {
        id:status.id,
        title:title,
        url:url,
        list:[
          {
            checked:true,
            name:"Create a todo gist cli",
            createdOn:"2016-02-23",
            dueBy:""
          },
          {
            checked:false,
            name:"Submit to NPM",
            createdOn:"2016-02-23",
            dueBy:"2016-03-02"
          }
        ]
      };
*/

/*sample todo.md file - put it into a grid? not sure if I want to keep track of the date/time created and the duedate
#<title>#
||Task|Created On|Due By|
|---|---|---:|---:|
| <ul><li>[x] </li></ul> |Create a CLI|Feb 23 2016||
| <ul><li>[ ] </li></ul> |Submit to NPM|Feb 24 2016|March 2 2016|
*/
//task defintion in markdown to parse
//| <ul><li>[x] </li></ul> | <Description - string> | <Created On - Date/time> | [Due On - Date/time]
 
/* basic file - this will be for release one. dates are not really required
#<title>#
- [x] Task1
- [ ] Task2
*/ 
 
module.exports = {
  config:{
    githubURL:""    
  },
  currentToDo: {
    id:"",
    title:"",
    url:"",
    list:[]
  },
  setGitHubURL:function(url){
    module.exports.config.githubURL = url;
    //if there is a client already defined, then update the proxy
    if(!client){
      client.requestDefaults['proxy'] = module.exports.config.githubURL;
    }
  },  
  toMarkdown: function(){
    var result ='';
    result +='#'+module.exports.currentToDo.title+'#'+os.EOL;
    for(var i=0;i<module.exports.currentToDo.list.length;i++){
      result+='- [' + (module.exports.currentToDo.list[i].checked?"x":" ") + '] ' + module.exports.currentToDo.list[i].name + '\n';
    }
    return result;  
  },      
  login: function (userid,password){
    try{
      client = github.client({
        username: userid,
        password: password
      });
      //set the proxy url if it has been set
      if(module.exports.config.githubURL!= null && module.exports.config.githubURL!=""){
          client.requestDefaults['proxy'] = module.exports.config.githubURL;
      }
      ghgist = client.gist();
    }catch(e){
      throw e;
    }
  },
  save: function(callback){
    //string builder / formatter in nodejs? need to figure out    
    
    /* - sample date to put
    {
      "description": "the description for this gist",
      "public": true,
      "files": {
        "file1.txt": {
          "content": "String file contents"
        }
      }
    }
    */            
    var gist = {
      id:module.exports.currentToDo.id,
      description:module.exports.currentToDo.title,
      public:false,
      files:{        
      }
    };
    gist.files['gistToDo-'+module.exports.currentToDo.title+'.md']={};
    gist.files['gistToDo-'+module.exports.currentToDo.title+'.md'].content=this.toMarkdown();
        
    ghgist.edit(gist.id,gist,callback);
    
  },
  list: function(callback){
    return ghgist.list(callback);    
  },
  load:function(id,callback){
        
    return ghgist.get(id,function(err,status,body){
      
      if(err){console.log("[ERROR] Load: " +err); callback(); return;}
      
      //do parsing here
      var filename="";
      for (filename in status.files) break;
      var title = filename.replace("gistToDo-","").replace(".md","");
      var lines = status.files[filename].content.split('\n');
      var url = status.url;
      var list = [];
                            
      for(var i=0;i<lines.length;i++){
        
        if(lines[i].indexOf('- [')>-1){         
          //parse the lines provided that they follow the format
          //- [x] <I am a task that is checked>
          //- [ ] <I am an unchecked task>
          list.push({
            checked : lines[i].indexOf('- [x]')?true:false,
            name: lines[i].substr(6),
          });
        }
      }
      
      module.exports.currentToDo.url= status.html_url;          
      module.exports.currentToDo.id = status.id;
      module.exports.currentToDo.title = title;
      module.exports.currentToDo.list = list;
                 
      callback();
    });
  },
  create:function(title,callback){
    
    var gist = {
      description:module.exports.currentToDo.title,
      public:false,
      files:{
      }
    };
    gist.files['gistToDo-'+module.exports.currentToDo.title+'.md']={};
    gist.files['gistToDo-'+module.exports.currentToDo.title+'.md'].content=this.toMarkdown();    
    
    ghgist.create(gist,function (err, status, body){

      if(err){console.log("[ERROR] Create: " +err); callback(); return;}
      
      module.exports.currentToDo.url= status.url;          
      module.exports.currentToDo.id = status.id;
                  
      callback();
    });    
  },  
  add:function(name,callback){
    module.exports.currentToDo.list.push({
      checked:false,
      name:name
    });
    this.save(callback);
  },
  
  todo: function(){    
    return module.exports.currentToDo;
  }
};