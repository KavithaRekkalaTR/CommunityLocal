<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:Atom="http://www.w3.org/2005/Atom" version="1.0">
<xsl:output method="xml"  />
<xsl:template match="/Atom:feed">

<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
<title>
<xsl:value-of select="Atom:title"></xsl:value-of>
</title>
  <meta http-equiv="X-UA-Compatible" content="IE=Edge" />
<style>

body {
	margin: 0px;
	padding: 0px;
	color: #000000;
	font-family: Arial, Helvetica;
	font-size: 12pt;
	background-color: #ffffff;
	color: #000000;
}

a:LINK {
	color: #666699;
	text-decoration: none;
}

a:ACTIVE {
	color: #ff0000;
}

a:VISITED {
	color: #000066;
	text-decoration: none;
}

a:HOVER {
	text-decoration: underline;
}

#Content {
	padding-top: 12px;
	padding-left: 35px;
	padding-right: 35px;
}

.atom {
	position: relative;
	display: inline;
	background-color: red;
	color: #ffffff;
	border: solid 2px black;
	padding: 5px;
	padding-top: 2px;
	padding-bottom: 2px;
	font-weight: bold;
	font-family: Arial, Helvetica;
	margin: 0px;
	font-size: 25pt;
	left: -15px;
	top: -5px;
}

h1,h2,h4 {
	color: #666666;
	font-weight: bold;
	font-family: Arial, Arial, Helvetica;
	margin: 0px;
	font-size: 25pt;
}

h2 {
	font-size: 16pt;
	margin-left: 16px;
}

h4 {
	font-size: 11pt;
	font-family: Arial, Helvetica;
}

#ContentDescription {
	margin: 35px;
	margin-bottom: 30px;
	color: #000000;
	border-color: #dddddd;
	border-width: 2px;
	border-style: solid;
	padding-left: 5px;
	padding-right: 5px;
	padding-bottom: 5px;
}

#ItemList {
	list-style-type: circle;
	color: #666666;
}

.ItemListItem {
	padding-bottom: 8px;
}

.ItemListItemDetails {
	font-family: Arial, Helvetica;
	font-size: 8pt;
	color: #333333;
}

</style>
</head>
<body xmlns="http://www.w3.org/1999/xhtml">
        <div id="ContentDescription">
          <div class="atom">Atom</div>
          <h1>What is Atom?</h1>
          <p>This page is an Atom syndication feed. Simply put, it's a common technique used for sharing content on the web for reuse.</p>
          <p>
            If you are not familiar with what Atom is and would like to learn more visit
            <a target="_blank" href="http://en.wikipedia.org/wiki/Atom_(standard)">Wikipedia</a>
            for an explanation.
          </p>
          <p>Using this web address (URL) you can use content from this site in a variety of tools and websites. For individuals, the most likely usage is within an application known as an feed reader. A feed reader is an application you run on your own computer which can request and store the content from feeds.</p>
          <p>To use this feed in your feed reader software you will need the web address (URL) of this page. Just copy and paste it where your feed reader software asks for a URL.</p>
        </div>

        <div id="Content">
          <h1>
            <xsl:value-of select="Atom:title" />
          </h1>
          <ol id="ItemList">
            <xsl:for-each select="Atom:entry">
              <li class="ItemListItem">
                <h4>
                  <a>
                    <xsl:attribute name="href">
                      <xsl:value-of select="Atom:link/@href"/>
                    </xsl:attribute>
                    <xsl:value-of select="Atom:title"/>
                  </a>
                </h4>
                <div class="ItemListItemDetails">
                  <xsl:variable name="PublishDate" select="Atom:published" />
                  <!-- Calculation for date formatting -->
                  <xsl:variable name="Year" select="substring($PublishDate, 1, 4)" />
                  <xsl:variable name="Month" select="substring($PublishDate, 6, 2)" />
                  <xsl:variable name="Day" select="substring($PublishDate, 9, 2)" />
                  <xsl:variable name="Time" select="substring($PublishDate, 12, 8)" />

                  <!-- Getting the month name -->
                  <xsl:variable name="MonthName">
                    <xsl:choose>
                      <xsl:when test="$Month = 01">Jan</xsl:when>
                      <xsl:when test="$Month = 02">Feb</xsl:when>
                      <xsl:when test="$Month = 03">Mar</xsl:when>
                      <xsl:when test="$Month = 04">Apr</xsl:when>
                      <xsl:when test="$Month = 05">May</xsl:when>
                      <xsl:when test="$Month = 06">Jun</xsl:when>
                      <xsl:when test="$Month = 07">Jul</xsl:when>
                      <xsl:when test="$Month = 08">Aug</xsl:when>
                      <xsl:when test="$Month = 09">Sep</xsl:when>
                      <xsl:when test="$Month = 10">Oct</xsl:when>
                      <xsl:when test="$Month = 11">Nov</xsl:when>
                      <xsl:when test="$Month = 12">Dec</xsl:when>
                      <xsl:otherwise>No Month</xsl:otherwise>
                    </xsl:choose>
                  </xsl:variable>
                  <!-- End of getting the month name -->
                  <!-- Making the output -->
                  <xsl:variable name="Output">
                    <xsl:value-of select="$Day" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="$MonthName" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="$Year" />
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="$Time" />
                  </xsl:variable>
                  <!-- End of making the output -->
                  <!-- End of calculation for date formatting -->
                  Published
                  <xsl:value-of select="$Output" />
                  by
                  <xsl:value-of select="Atom:author/Atom:name" />
                </div>
              </li>
            </xsl:for-each>
          </ol>
        </div>

      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>