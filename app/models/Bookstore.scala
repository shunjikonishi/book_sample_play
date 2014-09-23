package models

import play.api.libs.json._

case class Bookstore(
  id: Int,
  name: String,
  books: List[Book] = Nil
) {
  def toJson = JsObject(Seq(
    "id" -> JsNumber(id),
    "name" -> JsString(name),
    "books" -> JsArray(books.map(_.toJson))
  ))
}

case class Book(
  id: Int,
  name: String,
  author: Author,
  quantity: Int = 0
) {
  def toJson = JsObject(Seq(
    "id" -> JsNumber(id),
    "name" -> JsString(name),
    "author" -> author.toJson,
    "quantity" -> JsNumber(quantity)
  ))
}

case class Author(
  id: Int,
  name: String
) {
  def toJson = JsObject(Seq(
    "id" -> JsNumber(id),
    "name" -> JsString(name)
  ))
}
