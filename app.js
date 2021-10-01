const express = require('express');
const mongoose = require('mongoose');
require('dotenv/config');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

//TODOS SCHEMA

const TodosSchema = mongoose.Schema({
  name: String,
});

const Todo = mongoose.model('Todo', TodosSchema);

const todo1 = new Todo({
  name: 'Welcome to your todlist!',
});

const todo2 = new Todo({
  name: 'Hit the + button to add a new item.',
});

const todo3 = new Todo({
  name: '<--- Hit this to delete.',
});

const defaultTodos = [todo1, todo2, todo3];

//LISTS SCHEMA

const listSchema = mongoose.Schema({
  name: String,
  todos: [TodosSchema],
});

const List = mongoose.model('List', listSchema);

app.get('/', function (req, res) {
  Todo.find({}, function (err, foundTodos) {
    if (foundTodos.length === 0) {
      Todo.insertMany(defaultTodos, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully saved default todos to DB.');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', { listTitle: 'Today', newListItem: foundTodos });
    }
  });
});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          todos: defaultTodos,
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('list', {
          listTitle: foundList.name,
          newListItem: foundList.todos,
        });
      }
    }
  });
});

app.post('/', function (req, res) {
  const todoName = req.body.newItem;
  const listName = req.body.list;

  const todo = new Todo({
    name: todoName,
  });

  if (listName === 'Today') {
    todo.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.todos.push(todo);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post('/delete', function (req, res) {
  const checkedTodoId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Todo.findByIdAndRemove(checkedTodoId, function (err) {
      if (!err) {
        console.log('Successfully deleted todo.');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { todos: { _id: checkedTodoId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.post('/work', function (req, res) {
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect('/work');
});

mongoose.connect(process.env.DB_CONNECTION, () => {
  console.log('connected to db');
});

app.listen(3000, function () {
  console.log('Server started on port 3000.');
});
