function guidGenerator() {
		    var S4 = function() {
		       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		    };
		    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		}


		var commandMode=false;
		var today=new Date();

		var tasks = {
			settings: {
				subtasks:false,
				session:guidGenerator(),
				contenteditable:false,
				debug:true,
				draggable:true
			},
			
			themes: [],
			contexts: [],
			priority:["someday","low","medium","high"],
			months:["January","February","March","April","May","June","July","August","September","October","November","December"],
			weekdays:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
			messageTypes:["confirmation", "notice", "warning", "error"],
			year:2011,
			//Posible Actions
			actions:["Created","Time Logged","Done","Deleted","Updated"],
			command: "",
			trackCommand:function(){
				$("body").toggleClass("command-mode");

			},
			dragSource: null,



			metas:[
					{
						
						name:"Complete",
						type:"action"
						//callback:tasks.complete(task)
					},
					{
						
						name:"Log Time",
						type:"action"
						//callback:tasks.logTime()
					},
					{
						name:"Context",
						type:"action"
						//callback:switchContext()

					},
					{
						name:"Due Date",
						type:"display"
					}


				],



			init: function(){


						


				tasks.loadLocal();

				//Dragable
				
			
				$("link[href='depth.css']").attr("media","screen");
				//$(".task").on("click",);
				$(document).on("click", ".task", function(event){
					$(".task").removeClass("selected");$(this).addClass("selected");
					tasks.display($(".history",this));
					
				});

				

				$(document).on("click", ".reorder", function(event){

					event.preventDefault();
					if($("#container").is(".dragable-on"))
					{
						$(this).removeClass("active");
						tasks.dragableOff();
					}
					else
					{
						$(this).addClass("active");
						tasks.dragableOn();
					}
					
					
				});

				$(document).on("click", ".tasklist", function(event){
					event.preventDefault();
					if($(this).is(".new-tasklist")){
						
						tasks.newTasklist();
						return;


					}
					else 
					{
					var id = $(this).attr("id");
					console.log(id);
					tasks.loadTasklist(id);
					$("#tasks").attr("rel", id );	
					}				
				});

				$(document).on("click", ".tick", function(event){$(this).closest(".task").toggleClass("complete");});

				$("#add-task-form").on("submit",function(e){
					e.preventDefault();
					var txt = $("#add-task-input").val().trim();

					//console.log(tasks.parseTask(txt).task);
					if(tasks.parseTask(txt).task.trim()!=""){
					tasks.addTask(tasks.parseTask(txt).task,tasks.parseTask(txt).meta);
					}

					$("#add-task-input").val("");
				});

				$("#add-task-form").on("submit",function(e){
					e.preventDefault();
					var txt = $("#save-tasklist").val().trim();

					//console.log(tasks.parseTask(txt).task);
					if(tasks.parseTask(txt).task.trim()!=""){
					tasks.addTask(tasks.parseTask(txt).task,tasks.parseTask(txt).meta);
					}

					$("#add-task-input").val("");
				});



				$("#enter-time-form").on("submit",function(e){
					e.preventDefault();
					//var txt = $("#add-task-input").val().trim()
					//console.log(tasks.parseTask(txt).task);
					//tasks.addTask(tasks.parseTask(txt).task);

					//$("#enter-time-input").val("");
					
					//$("#enter-time").hide();
					//$("input").blur();
					
				

				});

				$("#save-tasklist-form").on("submit",function(e){
					e.preventDefault();
					var name = $("#tasklist-name-input").val().trim();
					{
						tasks.saveTasklist(name);
					}
					$("#add-task-input").val("").blur();
					$("#save-tasklist").hide();
				

				});

				$(document).on("click", ".clear-completed",function(){
					
					$(".task.complete").remove();
					tasks.saveLocal();

				});

				$(document).on("click", ".save-tasklist",function(){
					
					$("#save-tasklist").show();
					

				});

				if(tasks.settings.subtasks)
					{
						
						$("body").addClass("with-subtasks");

					}
				
				tasks.loadTasks();
				tasks.loadContexts();


				for (var item in tasks.metas) {
				  //console.log(tasks.metas[item]["name"]);
				}

				for (var item in tasks.actions) {
				  //console.log(tasks.actions[item]);
				}
			},

			showMessage: function(message,type){
				var mType;
				if(typeof(type)==="number" && type < tasks.messageTypes.length){
					mType = tasks.messageTypes[type];
				}
				else if(typeof(type)==="string" && $.inArray(type,tasks.messageTypes))
				{
					mtype = type;
				}
				else
				{
					mType = tasks.messageTypes[0];
				}
				var message = $("<div class='message'>"+message+"</div>");
				$(message).addClass(mType).appendTo("#display");


			},


			handleDragStart: function(e) {
				$(this).addClass('drag');  // this / e.target is the source node.

				tasks.dragSource = this;
				e.dataTransfer.effectAllowed = 'move';
			    e.dataTransfer.setData('text/html', this.outerHTML);
					  
			},

			handleDragOver: function (e) {
			  if (e.preventDefault) {
			    e.preventDefault(); // Necessary. Allows us to drop.
			  }

			

			  e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.

			  return false;
			},

			handleDragEnter: function(e) {
			  // this / e.target is the current hover target.
			  $(this).addClass('over');
			},

			handleDragLeave: function(e) {
			  $(this).removeClass('over');  // this / e.target is previous target element.
			},

			handleDrop: function(e) {
			  // this / e.target is current target element.

			  if (e.stopPropagation) {
			    e.stopPropagation(); // stops the browser from redirecting.
			  }

			 // Don't do anything if dropping the same column we're dragging.
			  if (tasks.dragSource != this) {
			    // Set the source column's HTML to the HTML of the columnwe dropped on.
			    tasks.dragSource.outerHTML = this.outerHTML;
			    this.outerHTML = e.dataTransfer.getData('text/html');
			    tasks.dragSource = null;
			  }

			  return false;
			},

			handleDragEnd: function(e) {
			  // this/e.target is the source node.

			  $(".task").removeClass('drag');
			  $(".task").removeClass('over');
			  
			},

			dragableOn: function(){
				$("#container").addClass("dragable-on");
				if(tasks.settings.draggable)
				{
					$(".task:not(.new-task)").attr("draggable",true);
					$(".context a").attr("draggable",true);
					$(".task header").append("<div class='drag-handle'></div>");
				}

				

				$(".task").each(function(){
					this.addEventListener('dragstart', tasks.handleDragStart, false);
					this.addEventListener('dragstart', tasks.handleDragStart, false);
					this.addEventListener('dragenter', tasks.handleDragEnter, false);
					this.addEventListener('dragover', tasks.handleDragOver, false);
					this.addEventListener('dragleave', tasks.handleDragLeave, false);
					this.addEventListener('drop', tasks.handleDrop, false);
  					this.addEventListener('dragend', tasks.handleDragEnd, false);
				});

			},

			dragableOff: function(){
				$("#container").removeClass("dragable-on");
				if(tasks.settings.draggable)
				{
					$(".task:not(.new-task)").attr("draggable",false);
					$(".context a").attr("draggable",false);
					$(".task header .drag-handle").remove();
				}

			},

			loadTasklist:function(name){
				if(localStorage.getItem(name))
				{
					
					$("#tasks").html(localStorage.getItem(name));
					console.log("Load Tasklist");
				}

				tasks.saveLocal();
			},

			saveTasklist:function(name){

				console.log("Save Tasklist");
				var id =  name.replace(" ","");

				if(!localStorage.getItem(name)){

				
				}

				localStorage.setItem(id, $('#tasks').html());
				$("#tasklists ul").append("<li class='tasklist' id='"+id+"'><a href='#"+id+"'>"+name+"</a></li>");
				console.log(id);

				tasks.saveLocal();


			},

			newTasklist: function(){
				
				$(".task:not(.new-task)").remove();

			},

			switchContext:function(){
				if($(".context.active").length){
				$(".context.active").removeClass("active").next().addClass("active");
				}
				else
				{
					$(".context:first").addClass("active");
				}
			},

			insertAtIndex: function(n){
				
			},

			saveLocal: function(){
				
				localStorage.setItem('tasks', $('#tasks').html());
				localStorage.setItem('tasklists', $('#tasklists').html());
				console.log("Tasks Saved");
			},
			loadLocal: function() {
				

				if(localStorage.getItem("tasks"))
				{
					
					$("#tasks").html(localStorage.getItem("tasks"));

				}
				if(localStorage.tasklists)
				//if(localStorage.getItem("tasklists"))
				{
					
					//$("#tasklists").html(localStorage.getItem("tasklists"));
					$("#tasklists").html(localStorage.tasklists);

				}
				console.log("Tasks Loaded");

			},
			
			loadTasks: function(){
				//Load tasks start with fixture
			},

			loadContexts: function(){
				//Load Extra Contexts
				tasks.contexts = ["My Work",  "Admin", "Innovation", "Learning", "Misc","Some Day"];
				$.each(tasks.contexts, function(index,value){
					$("#contexts .list").append("<li class='context'><a href='#"+value+"'>"+value+"</li>");
				});
			},

			addTask: function(name, meta){
				var guid = guidGenerator();
				var t = $("<article id='"+ guid +"' class='task active'></article>");

				t.data(meta);

				
				
				if(meta.context){
				 var contexts=$('<ul class="task-contexts"></ul>');
				 $.each(meta.context,function(index,value){
					var v = value.replace("@","");
					$(contexts).append("<li  class='task-context'><a href='#"+v+"'>"+v+"</a></li>");

				})
				}
				var header= $("<header></header>");
				$(header).append("<div class='tick'></div><h2>"+name+"</h2>").append(contexts).appendTo(t);
				//$("<div class='tick'></div><h2>"+name+"</h2>").appendTo(t).wrap();

				var history=$('<section class="history"></section>');

				var log_header=$('<header>\
								<h3>Task History</h3>\
								</header>');
				var log=$('<li id="'+guid+'">\
					<span class="date">'+tasks.months[today.getMonth()]+" "+today.getDate()+", "+today.getFullYear()+'</span>\
					<span class="action">Created</span> \
								</li>').wrap("<ul></ul>");
			  
			    if (meta.due){
				var meta_section = $("<section class='meta'></section>");
				var meta_ul = $("<ul></ul>");
				var due_li = $('<li class="due-date"><a href="#" title="">'+meta.due+'</a></li>');

				$(due_li).appendTo(meta_ul);
				$(meta_ul).appendTo(meta_section);
				$(t).append(meta_section).addClass("due-date");
				}
				$(history).append(log_header).append(log).appendTo(t);
				
				$('#tasks').prepend(t);

				console.log("Task Added");
			},

			parseTask: function(task){

				console.log("Parse Task");

				//Scheduled/Unscheduled
				var re = new RegExp(/^\-/i);
				var s = task.match(re) ? "U" : "S";
				task = task.replace(re,"").trim();

				// console.log(s);
				// console.log(task);
				
				//Parse for contexts
				var re = new RegExp(/@(\w+)/ig);
				var c = task.match(re);
				task = task.replace(re,"").trim();

				//console.log(c.join(",").replace(/@/g,""));
				//console.log(task);

				//Parse for priority
				var re = new RegExp(/(!)(\w+)/i);
				var i = task.match(re);
				task = task.replace(re,"").trim();

				// console.log(i);
				// console.log(task);

				//Parse for Day
				var re = new RegExp(/(Today|Tommorow|Monday|Tuesday|Wednesday|Thursday|Friday|Next\sWeek)\s/i);
				var w = task.match(re);
				task = task.replace(re,"").trim();

				// console.log(w);
				// console.log(task);

				//Parse for due:
				
				var re = new RegExp(/(on:)(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept|Oct|Nov|Dec)(\s)(\d{1,2})/i);
				var day = task.match(re);
				task = task.replace(re,"").trim();
				if(day)
				{
				date = new Date(day[2]+" "+day[4]+" "+today.getFullYear());
				
				var one_day=1000*60*60*24; //Seconds
				var due=day[2]+" "+day[4];
				days_until= Math.ceil((date.getTime()-today.getTime())/(one_day));
				console.log("===");
				console.log(day);
				console.log(day[2]+" "+day[4]);
				console.log(null ? date.getFullYear() : "");
				console.log("For " + tasks.weekdays[date.getDay()]);
				console.log("Days Until " + days_until);
				console.log(task);
								console.log("===");

				}


				console.log(c);
				return  {
					"task":task,
					"meta":{
					"context":null ? ["misc"] : c,
					"importance":null ?i[2].replace("!","") : 0,
					"weekday":w,
					"due_in":null ? days_until : null,
					"raw_date":null ? date : null,
					"due":due

						}
					}
				
			},

			deleteTask:function(task){
				$(task).remove();
				tasks.saveLocal();
				console.log("Tasks Deleted");
			},

			
			display:function(elem){
				$("#display").empty().append($(elem).clone());
			},
			logTime: function(task){
				
				$(task)

			},
			contentEditable: function(){
				$("#tasks").addClass("editable");
				$(".task:not(.complete)").attr("contenteditable",true);

				console.log("Content Editable");

			},
			disableEditable: function(){
				$("#tasks").removeClass("editable");
				$(".task:not(.complete)").attr("contenteditable",false);
				console.log("Content Editable OFF");

			},
			getLastKey: function()
			{
				return tasks.settings.command;
			},
			setLastKey: function(key)
			{
				tasks.settings.command = key;
				console.log(key);
			}




			
			


		}