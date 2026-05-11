CREATE TABLE "customers" ( "id" INTEGER NOT NULL UNIQUE, "username"
TEXT NOT NULL UNIQUE, "password" TEXT NOT NULL, "email" TEXT NOT
NULL, "cart" TEXT, "wishlist" TEXT, "previous_orders" TEXT,
"current_orders" TEXT, PRIMARY KEY("id") )

CREATE TABLE "products" (
	"id"	INTEGER NOT NULL,
	"title"	TEXT,
	"description"	TEXT,
	"img_sources"	TEXT,
	"tags"	TEXT,
	"price"	INTEGER,
	"specifications"	REAL,
	"availability"	INTEGER,
	"in_banner"	INTEGER,
	"company"	TEXT,
	"main_category"	TEXT,
	PRIMARY KEY("id")
)