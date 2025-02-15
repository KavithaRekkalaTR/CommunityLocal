﻿<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:dc="http://purl.org/dc/elements/1.1/" version="1.0">
<xsl:output method="xml"  />
<xsl:template match="/">

<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
<title><xsl:value-of select="rss/channel/title"/></title>
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

.rss {
	position: relative;
	display: inline;
	background-color: orange;
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
		<div class="rss">RSS</div>
		<h1>What is RSS?</h1>
		<p>	
	        This page is an RSS syndication feed. Simply put, it's a common technique used for sharing content on the web for reuse.
	        </p>
		<p>
		If you are not familiar with what RSS is and would like to learn more visit <a target="_blank" href="http://en.wikipedia.org/wiki/RSS_%28file_format%29">Wikipedia</a> for an explanation.
		</p>
        	<p>
		Using this web address (URL) you can use content from this site in a variety of tools and websites. For individuals, the most likely usage 
		is within an application known as an RSS reader. An RSS reader is an application you run on your own computer which can request and store the 
	        content from RSS feeds.
		</p>
                <p>
		To use this feed in your RSS reader software you will need the web address (URL) of this page. Just copy and paste it where your RSS Reader software asks for a URL.
		</p>
	</div>
	
	<div id="Content">
		<h1><xsl:value-of select="rss/channel/title"/></h1>
		
		<ol id="ItemList">
			<xsl:for-each select="rss/channel/item">       
				<li class="ItemListItem">
					<h4><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a></h4>
					<div class="ItemListItemDetails">
						Published <xsl:value-of select="pubDate"/>
						<xsl:if test="dc:creator!=''">
						  by <xsl:value-of select="dc:creator" />
						</xsl:if>
					</div>
				</li>
			</xsl:for-each>
		</ol>
	</div>
	
</body>
</html>

</xsl:template>
</xsl:stylesheet>