var vorpal = require('vorpal')();
var dateformat = require('dateformat');
var todoStore = require('./todoStore.js');
var open = require('open');

//pretty print the currently loaded todolist in the store
var prettyPrint = function(v){
  var todo = todoStore.currentToDo;
  const self = v;
  self.log("");
  self.log(todo.title);
  self.log("----------------------------------");
  for(var i=0;i<todo.list.length;i++){
      self.log(i+1 + ". (" + (todo.list[i].checked?"*":" ") + ") " + todo.list[i].name);
  }  
};

//configure the gist-to-do cli
vorpal
  .command('config', 'Set configuration options.')
    .option('-g, --githubURL', 'Overrirde the github url.')
    .option('-l, --list','List the current set configuraiton settings.')
    .option('-c, --clear','Clear all preset configurations.')
    .action(function(args, callback) {
     const self = this;          
     if (args.options.githubURL) {
        //set hte local store to use the github url proxy provided       
        todoStore.setGitHubURL(args.options.githubURL);
        //cache the url to remember it
        vorpal.localStorage.setItem('githubURL',args.options.githubURL);       
     }
     if (args.options.clear) {
       //remove the local proxy setting       
        todoStore.setGitHubURL('');
        //clear out all configuration options
        vorpal.localStorage.setItem('githubURL','');       
     }
     if(args.options.list){
       //list out the known configuration options
       self.log("Options");
       self.log("-------");
       var githubUrl= vorpal.localStorage.getItem('githubURL');
       self.log("githubURL: " +  githubUrl );
     }
     callback();    
  });
 
//create a new todo list
vorpal
  .command('create <title>', 'Create a new ToDo List.')
  .action(function(args, callback) {
    const self = this;    
    if(vorpal.localStorage.getItem('userid')===""){
      self.log("Please log in first.");
    }else{
      todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
    }    
    todoStore.create(args.title,callback);        
  });

//add a new task on the end of the list  
vorpal
  .command('add <name>', 'Add a new task.')
  .action(function(args, callback) {
    const self = this;    
    if(vorpal.localStorage.getItem('userid')===""){
      self.log("Please log in first.");
    }else{
      todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
    }
    todoStore.add(args.name,callback);     
  });  

//list all the known todo lists that you have available
//they must follow the format gistToDo-<some title>.md  
vorpal
  .command('list', 'List all known ToDo lists.')
  .action(function(args, callback) {
    const self = this;    
    if(vorpal.localStorage.getItem('userid')===""){
      self.log("Please log in first.");
    }else{
      
      todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
    }    
    todoStore.list(
      function (err, status, body){
        
        if(err){self.log("[ERROR] Load: " +err); callback(); return;}
        
        for(var i=0;i<status.length;i++){  
          for (filename in status[i].files) break;
          //fix this is it instr with javascript? not sure
          if(filename.indexOf("gistToDo-")>-1){
              //strip out the prefix and the .md file extension
              self.log((i+1)+". "+ filename.replace("gistToDo-","").replace(".md",""));
          }
        }
        callback();      
    });
  });  
  
vorpal
  .command('load', 'Load and set the active ToDo list.')
    .action(function(args, callback) {
    const self = this;    
    if(vorpal.localStorage.getItem('userid')===""){
      self.log("Please log in first.");
    }else{
      todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
    }
    todoStore.list(
      function (err, status, body){
        
        if(err){self.log("[ERROR] Load: " +err); callback(); return;}
        
        var choiceList = [];
        for(var i=0;i<status.length;i++){  
          for (filename in status[i].files) break;
          if(filename.indexOf("gistToDo-")>-1){
              //strip out the prefix and the .md file extension
              choiceList.push(
              {
                id:status[i].id,
                name:filename.replace("gistToDo-","").replace(".md",""),              
                file:status[i].files
              });              
          }          
        }
        self.prompt({
          type: 'list',
          name: 'gist',          
          choices: choiceList,
          message: 'Set the ToDo List gist: ',
          },
          function(result){
            if (result.gist){
              for(var i=0;i<choiceList.length;i++){
                if(choiceList[i].name === result.gist){
                  todoStore.load(choiceList[i].id,function(){  
                      prettyPrint(self);                    
                      callback();
                    }
                  );                  
                }
              }                                          
            }           
        });    
    });
  });    

//add an option -b to instead open the gist in the default browser
vorpal
  .command('show', 'Render the current to do list.')
    .option('-v, --verbose', 'Opens the current todo list in your web browser.')
    .action(function(args, callback) {
     const self = this;
     if (args.options.verbose) {
       open(todoStore.currentToDo.url);
     }else{
        prettyPrint(self);
     }
     callback();    
  });
    
//check the tasks (toggle the check box)
vorpal
  .command('check [taskId]', 'Check off the given task, optionally select the task from a list to check off.')
  .action(function(args, callback) {
    const self = this;    
    if(vorpal.localStorage.getItem('userid')===""){
      self.log("Please log in first.");
    }else{
      todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
    }      
    
    //if there is no loaded list or items to check off, exit
    if(todoStore.currentToDo.id === "" || todoStore.currentToDo.list === null || todoStore.currentToDo.list.length===0){    
      self.log("There are no items check off.");
      callback();
      return;
    }
    
    //if a taskid in the list is provided, toggle the check
    if(args.taskId){
      try{        
        todoStore.currentToDo.list[args.taskId-1].checked=!todoStore.currentToDo.list[args.taskId-1].checked;
        //apply the changes
        todoStore.save(function(callback){
          prettyPrint(self);
          callback();
         });
      }catch(e){
        self.log("That is an invalid selection.");
        callback();
      }
    }else{      
      //esle, provide a list of check boxes can can be toggled
      self.prompt({
        type: 'checkbox',
        name: 'list',          
        choices: todoStore.currentToDo.list,
        message: 'Check/Uncheck the tasks: ',
        },
        function(result){        
          if (result.list){
            //update the check list, checking and unchecking the tasks
            for(var i=0;i<todoStore.currentToDo.list.length;i++){
              todoStore.currentToDo.list[i].checked=false;
              for(var j=0;j<result.list.length;j++){
                if(result.list[j]===todoStore.currentToDo.list[i].name){
                  todoStore.currentToDo.list[i].checked=true;
                } 
              }
            }      
            //apply the changes
            todoStore.save(function(){
              prettyPrint(self);
              callback();
            });                                        
          }       
      });   
    } 
    
  });
  
//delete a task
vorpal
  .command('delete [taskId]', 'Delete the given task, optionally select the task to delete from the list if no list number is provided.')
  .action(function(args, callback) {
    const self = this;    
    if(vorpal.localStorage.getItem('userid')===""){
      self.log("Please log in first.");
    }else{
      todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
    }      
    
    //if there is no loaded list or items to delete, exit
    if(todoStore.currentToDo.id === "" || todoStore.currentToDo.list === null || todoStore.currentToDo.list.length===0){    
      self.log("There are no items check off.");
      callback();
      return;
    }
    
    //if a taskid in the list is provided, then directly delete it with a confrim
    if(args.taskId){
      try{
        self.prompt({
          type: 'confirm',
          name: 'delete',
          message: 'Are you sure that you want to delete task "' + todoStore.currentToDo.list[args.taskId-1].name +'"?',
          },
          function(result){
                todoStore.currentToDo.list.splice(args.taskId-1,1);                                 
                //apply the changes
                todoStore.save(function(){
                  prettyPrint(self);          
                  callback();
                });
          });
        }catch(e){
          self.log("That is an invalid selection.");
          callback();
        }      
    }else{
      //else, provide a list of check boxes can can be toggled
      self.prompt({
        type: 'list',
        name: 'task',          
        choices: todoStore.currentToDo.list,
        message: 'Select a task to delete: ',
        },
        function(result){
          //should i add another confirmation here?         
          if (result){
            //remove the select task from the list
            for(var i=0;i<todoStore.currentToDo.list.length;i++){              
              if(result.task===todoStore.currentToDo.list[i].name){                
                todoStore.currentToDo.list.splice(i,1);
              } 
            }
            //apply the changes
            todoStore.save(function(){
              prettyPrint(self);
              callback();
            });                                        
          }       
      });   
    } 
});  

//archive all the tasks that are checked
vorpal
  .command('archive', 'Archive all tasks that have been completed.')
  .action(function(args, callback) {
    const self = this;    
    if(vorpal.localStorage.getItem('userid')===""){
      self.log("Please log in first.");
    }else{
      todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
    }      
    self.prompt({
      type: 'confirm',
      name: 'delete',
      message: 'Are you sure that you want to archive all the tasks?',
      },
      function(result){
            //create a new list of the unchekced items
            var newList =[];            
            for(var i=0;i<todoStore.currentToDo.list.length;i++){              
              if(!todoStore.currentToDo.list[i].checked){
                newList.push(todoStore.currentToDo.list[i]);
              }
            }                                 
            todoStore.currentToDo.list=newList;
            //apply the changes
            todoStore.save(function(){
              prettyPrint(self);          
              callback();
            });
      });     
});  

  
vorpal
  .command('whoami', 'Who is the currently logged in user?')
  .action(function(args, callback) {
    const self = this;    
    if( vorpal.localStorage.getItem('userid')!=""){
       self.log("The user currently logged in is: "+vorpal.localStorage.getItem('userid'));
    }else{
      self.log("No users is logged in. Please use the 'login' command.");
    } 
    callback();   
  });

vorpal
  .command('login', 'Set github credentials by logging in.')
  .action(function(args, callback) {      
    const self = this;
    self.prompt({
      type: 'input',
      name: 'userid',
      default: false,
      message: 'github userid: ',
      },
      function(result){
        if (result.userid)        
          vorpal.localStorage.setItem('userid', result.userid);
        self.prompt({
          type: 'password',
          name: 'password',
          default: false,
          message: 'github password: ',
          },
          function(result){
            if (result.password){
              vorpal.localStorage.setItem('password', result.password);
              todoStore.login(vorpal.localStorage.getItem('userid'),vorpal.localStorage.getItem('password'));
            } 
            callback();
        });        
    });    
  });
 
vorpal
  .localStorage('todo')
  .delimiter('todogist$')
  .show();
  
//set up the default settings    
if(vorpal.localStorage.getItem('githubURL')!=null && vorpal.localStorage.getItem('githubURL')!=""){  
  todoStore.setGitHubURL(vorpal.localStorage.getItem('githubURL'));
}
