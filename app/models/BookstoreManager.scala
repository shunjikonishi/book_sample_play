package models

import scalikejdbc._

class BookstoreManager {
  def books: List[Book] = DB.readOnly { implicit session =>
    sql"""SELECT 
        A.id,
        A.name,
        B.id,
        B.name
      FROM books A INNER JOIN authors B ON (A.author_id = B.id)
      ORDER BY B.name, A.id
    """.map { rs =>
      val author = Author(
        id=rs.int(3),
        name=rs.string(4)
      )
      Book(
        id=rs.int(1),
        name=rs.string(2),
        author=author
      )
    }.list.apply
  }

  def shops: List[Bookstore] = DB.readOnly { implicit session =>
    sql"""SELECT 
        A.id,
        A.name
      FROM bookstores A
      ORDER BY A.id
    """.map { rs =>
      Bookstore(
        id=rs.int("id"),
        name=rs.string("name")
      )
    }.list.apply
  }

  def shop(shopId: Int): Option[Bookstore] = DB.readOnly { implicit session =>
    sql"""SELECT 
        A.id,
        A.name
      FROM bookstores A
      WHERE A.id = ?
    """.bind(shopId)
    .map { rs =>
      Bookstore(
        id=rs.int("id"),
        name=rs.string("name")
      )
    }.single.apply
  }

  def belongsToShop(shopId: Int): List[Book] = DB.readOnly { implicit session =>
    sql"""SELECT 
        A.id,
        A.name,
        B.id,
        B.name,
        COUNT(*) as quantity
      FROM books A INNER JOIN authors B ON (A.author_id = B.id)
                   INNER JOIN bookstore_books C ON (A.id = C.book_id)
      WHERE C.bookstore_id = ?
      GROUP BY A.id, A.name, B.id, B.name
      ORDER BY A.name
    """.bind(shopId)
    .map { rs =>
      val author = Author(
        id=rs.int(3),
        name=rs.string(4)
      )
      Book(
        id=rs.int(1),
        name=rs.string(2),
        author=author,
        rs.int(5)
      )
    }.list.apply
  }

  def booksWithQuantity: List[Book] = DB.readOnly { implicit session =>
    sql"""SELECT 
        A.id,
        A.name,
        B.id,
        B.name,
        COUNT(C.bookstore_id) as quantity
      FROM books A INNER JOIN authors B ON (A.author_id = B.id)
                   LEFT OUTER JOIN bookstore_books C ON (A.id = C.book_id)
      GROUP BY A.id, A.name, B.id, B.name
      ORDER BY quantity desc, A.id
    """.map { rs =>
      val author = Author(
        id=rs.int(3),
        name=rs.string(4)
      )
      Book(
        id=rs.int(1),
        name=rs.string(2),
        author=author,
        rs.int(5)
      )
    }.list.apply
  }
}

object BookstoreManager extends BookstoreManager