<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:dc="http://purl.org/dc/elements/1.1/" version="1.0">
  <xsl:output method="xml" indent="yes" />
  <xsl:template match="opml">

    <xsl:variable name="OPMLtitle" select="head/title"/>
    
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
      <head>
        <title>
          <xsl:value-of select="$OPMLtitle"/>
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

          .opml {
          position: relative;
          display: inline;
          background-color: blue;
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
          <div class="opml">OPML</div>
          <h1>What is OPML?</h1>
          <p>
            This page is an OPML list of the blogs found on this site. Publishing an OPML list is a common (and standard) way to share lists of bloggers. This list can be read by software, such as an RSS Reader, to populate a list of blogs to subscribe to.
          </p>
          <p>
            If you would like to learn more about OPML visit <a target="_blank" href="http://en.wikipedia.org/wiki/OPML">Wikipedia</a> for an explanation.
          </p>
        </div>

        <div id="Content">

          <xsl:for-each select="/opml/body/outline">
            <h1>
              <xsl:value-of select="@text"/>
            </h1>

            <ol id="ItemList">
              <xsl:for-each select="./outline">
                <li class="ItemListItem">
                  <h4>
                    <a>
                      <xsl:attribute name="href">
                        <xsl:value-of select="@htmlUrl"/>
                      </xsl:attribute>
                      <xsl:value-of select="@title"/>
                    </a>
                  </h4>
                </li>
              </xsl:for-each>
            </ol>
          </xsl:for-each>
        </div>

      </body>
    </html>

  </xsl:template>
</xsl:stylesheet>