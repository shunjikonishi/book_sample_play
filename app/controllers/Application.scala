package controllers

import play.api._
import play.api.mvc._
import play.api.libs.json._
import models.BookstoreManager

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }

  def indexWithId(id: Int) = Action {
    Ok(views.html.index())
  }

  def books = Action {
    val books = BookstoreManager.books
    Ok(JsArray(books.map(_.toJson)))
  }

  def shops = Action {
    val shops = BookstoreManager.shops
    Ok(JsArray(shops.map(_.toJson)))
  }

  def shopDetail(id: Int) = Action {
    BookstoreManager.shop(id).map { shop =>
      val books = BookstoreManager.belongsToShop(id)
      Ok(JsObject(Seq(
        "shop" -> shop.toJson,
        "books" ->JsArray(books.map(_.toJson))
      )))
    }.getOrElse(NotFound)
  }

  def booksWithQuantity = Action {
    val books = BookstoreManager.booksWithQuantity
    Ok(JsArray(books.map(_.toJson)))
  }

  def template_books = Action {
    Ok(views.html.books())
  }

  def template_shops = Action {
    Ok(views.html.shops())
  }

  def template_shopDetail = Action {
    Ok(views.html.shopDetail())
  }

  def template_booksWithQuantity = Action {
    Ok(views.html.booksWithQuantity())
  }
}