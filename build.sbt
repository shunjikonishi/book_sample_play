name := """book-sample-play"""

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

scalaVersion := "2.11.1"

libraryDependencies ++= Seq(
  cache,
  ws,
  "org.scalikejdbc" %% "scalikejdbc" % "2.0.7",
  "org.scalikejdbc" %% "scalikejdbc-play-plugin" % "2.3.0",
  "postgresql" % "postgresql" % "9.1-901.jdbc4"
)

sources in (Compile, doc) := Seq.empty

publishArtifact in (Compile, packageDoc) := false

