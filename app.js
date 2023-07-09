//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const URI = "mongodb+srv://admin:q6sy6CSZ9KnRMPw6@cluster0.ooo3g.mongodb.net/todolistDB?retryWrites=true&w=majority"
mongoose.connect(
  URI,
  { useNewUrlParser: true })

const itemsSchema = new mongoose.Schema({
  name: String,
  checkStatus: {
    type: Boolean,
    default: false
  }
})

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: "Welcome to your to do list!",
  checkStatus: false
})

const item2 = new Item({
  name: "Click + to add a new item",
  checkStatus: false
})

const item3 = new Item({
  name: "Click x to delete item",
  checkStatus: false
})

let defaultItems = [item1, item2, item3]

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model("List", listSchema)

app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length == 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("items added")
        }
      })
      res.redirect("/")
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }


  })
});

app.get("/:listTitle", function (req, res) {
  let listTitle = _.capitalize(req.params.listTitle)
  List.findOne({ name: listTitle }, (err, list) => {
    if (err) {
      console.log(err)
    } else {
      if (list) {
        res.render("list", { listTitle: list.name, newListItems: list.items })
      } else {
        const list = new List({
          name: listTitle,
          items: defaultItems
        })
        list.save()
        res.redirect("/" + listTitle)
      }
    }
  })

})

app.post("/", function (req, res) {

  const itemName = req.body.newItem
  const listName = req.body.list
  const item = new Item({
    name: itemName
  })

  if (listName == "Today") {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({ name: listName }, (err, list) => {
      list.items.push(item)
      list.save()
      res.redirect("/" + listName)
    })
  }


});

app.post("/delete", (req, res) => {
  const deleteItem = req.body.delete
  const title = req.body.list

  if (title == "Today") {
    Item.findByIdAndRemove(deleteItem, (err) => {
      if (!err) {
        err = "deleted!"
      }
      console.log(err)
    })
    res.redirect("/")
  } else {
    const update = { $pull: { items: { _id: deleteItem } } }
    List.findOneAndUpdate({ name: title }, update, function (err, list) {
      if (err) {
        console.log(err)
      }
      else {
        res.redirect("/" + title)
        console.log(`updated list ${title}`)
      }
    })
  }
})

app.post("/check", (req, res) => {
  const checkID = req.body.check
  const title = req.body.list
  if (title == "Today") {
    Item.findOne({ _id: checkID }, function (err, item) {
      item.checkStatus = !item.checkStatus;
      item.save(function (err, updatedItem) {
        if (err) {
          console.log(err)
        } else {
          res.redirect("/")
        }
      });
    })
  } else {
    List.findOne({ "items._id": checkID }, (err, list) => {
      if (err) {
        console.log(err)
      } else {
        list.items.filter(item => item._id == checkID)[0].checkStatus = !list.items.filter(item => item._id == checkID)[0].checkStatus
        list.save(function (err, updatedItem) {
        })
      }
    })
    res.redirect(`/${title}`)
  }
})

app.get("/about", function (req, res) {
  res.render("about")
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started.")
})

