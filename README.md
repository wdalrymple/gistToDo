#Gist To-Do CLI
##Depdenencies##
- octonode
- vorpal
- open

##Installation##
```javascript
$ npm install gistToDo
```

##Useage##

To start the console:
```javscript
$ node todo
```

To use the console:
```javascript
todo$ <command>
```

|Command|Description|Options|
|---|---|---|
|login|Login with your github credentials (userid/password). These are cached locally.||
|whoami|Ouput the userid of the currently logged in user||
|list|List known gists that follow the pattern gistToDo-{title}.md|| 
|show|Display the current ToDo list loaded|\-v (--verbose) {open the gist in the browser}|
|create|Create a new ToDo List|title {the title for the ToDo list and used in the gist file name}|
|add|Add a new task|task {the text for a new task, encapsulate in "" if its more than one word}| 
|check|Check/Uncheck tasks in the current list|[taskId] {optional task number to check off, else, a check list is provided}| 
|load|Load and set a ToDo list from known gists that follow the pattern gistToDo-{title}.md||
|delete|Delete a task.|[taskId] {optional task number to delete, else a list of tasks for deletion will be provided}|