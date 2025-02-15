  /*******/

  var IE4 = document.all;
  var NS6 = document.getElementById && !document.all;
  var disappearDelay = 500; // miliseconds
      
  function DynamicHide (node, e) {
    if ((IE4 && !node.contains(e.toElement)) ||
        (NS6 && e.currentTarget != e.relatedTarget && !NS6_Contains( e.currentTarget, e.relatedTarget ))) 
    {
      InitTimer( node );
    } 
  }  
  
  function HideObject (nodeID) {    
    var node = document.getElementById( nodeID );
    
    if (typeof node != "undefined") {
      if (IE4 || NS6) {
        node.style.visibility = "hidden";
        node.style.display = 'none';
      }
    }
  }
  
  function ReleaseTimer (node) {    
    if (typeof node != "undefined") {
      if (typeof node.HideTimer != "undefined") {
        clearTimeout( node.HideTimer );
      }
    }
  }
  
  function InitTimer (node) {
    if (typeof node != "undefined") {
      var callBack = 'HideObject( "' + node.getAttribute( 'id' ) + '" )';      
      node.HideTimer = setTimeout( callBack, disappearDelay );
    }
  }
    
  function NS6_Contains (a, b) {
    while (b.parentNode) {
      if ((b = b.parentNode) == a)
        return true;
    }
    
    return false;
  }
        
  /*******/
   
  function ToggleSendToFriend() {
    sendToFriendForm = document.getElementById('SendToFriendForm');
    sendToFriendButton = document.getElementById('SendToFriendButton');

    if (sendToFriendForm.style.visibility == "hidden") {
      sendToFriendForm.style.visibility = "visible";
      sendToFriendForm.style.display = 'block';
    } else {
      sendToFriendForm.style.visibility = "hidden";
      sendToFriendForm.style.display = 'none';
    }

    //sendToFriendForm.style.left = getposOffset(sendToFriendButton, "left") - sendToFriendForm.offsetWidth + sendToFriendButton.offsetWidth;
    sendToFriendForm.style.left = getposOffset(sendToFriendButton, "left") - (sendToFriendForm.offsetWidth / 2) + (sendToFriendButton.offsetWidth / 2);
    sendToFriendForm.style.top = getposOffset(sendToFriendButton, "top") + sendToFriendButton.offsetHeight;
  }
  
  function ToggleAddComment() {
    commentMenu = document.getElementById('CommentMenu');
    commentButton = document.getElementById('CommentButton');

    commentMenu.style.left = getposOffset(commentButton, "left");
    commentMenu.style.top = getposOffset(commentButton, "top") + commentButton.offsetHeight;

    if (commentMenu.style.visibility == "hidden") {
      commentMenu.style.visibility = "visible";
      commentMenu.style.display = 'block';
    } else {
      commentMenu.style.visibility = "hidden";
      commentMenu.style.display = 'none';
    }
  }
  
  function ToggleGalleryThumbnail(pictureID) {
    largeThumbDiv = document.getElementById('SecondaryThumbDiv' + pictureID);
    smallThumb = document.getElementById('SmallThumb' + pictureID);

    if (largeThumbDiv.className == "secondaryThumbnailHidden") {
      largeThumbDiv.className = "secondaryThumbnailPopup";
      largeThumbDiv.style.left = getposOffset(smallThumb, "left") - ((largeThumbDiv.offsetWidth - smallThumb.offsetWidth) / 2) + "px";
      largeThumbDiv.style.top = getposOffset(smallThumb, "top")  - ((largeThumbDiv.offsetHeight - smallThumb.offsetHeight) / 2) + "px";
      setTimeout(function() { largeThumbDiv.style.visibility = "visible"; }, 5);
    } else {
	  largeThumbDiv.className = "secondaryThumbnailHidden";
    }
  }
  
  function ToggleRateMenu() {
    rateMenu = document.getElementById('RateMenu');
    rateButton = document.getElementById('RateButton');
    
    rateMenu.style.left = getposOffset(rateButton, "left");
    rateMenu.style.top = getposOffset(rateButton, "top") + rateButton.offsetHeight;

    if (rateMenu.style.visibility == "hidden") {
      rateMenu.style.visibility = "visible";
      rateMenu.style.display = 'block';
    } else {
      rateMenu.style.visibility = "hidden";
      rateMenu.style.display = 'none';
    }
    
    // Init autohide
    if (window.event) {
      event.cancelBubble = true;
    }
    
    ReleaseTimer( rateMenu );
  }
  
  function ToggleRatePostMenu(control) {
	rateButton = control.parentNode;
	rateMenu = rateButton.nextSibling.nextSibling;

	if ((rateButton.id != "RateButton") || (rateMenu.id != "RateMenu"))
		return;

    rateMenu.style.left = getposOffset(rateButton, "left");
    rateMenu.style.top = getposOffset(rateButton, "top") + rateButton.offsetHeight;

    if (rateMenu.style.visibility == "hidden") {
      rateMenu.style.visibility = "visible";
      rateMenu.style.display = 'block';
    } else {
      rateMenu.style.visibility = "hidden";
      rateMenu.style.display = 'none';
    }
    
    // Init autohide
    if (window.event) {
      event.cancelBubble = true;
    }
    
    ReleaseTimer( rateMenu );
  }

  function ToggleSearchMenu() {
    searchMenu = document.getElementById('SearchMenu');
    searchButton = document.getElementById('SearchButton');

    searchMenu.style.left = getposOffset(searchButton, "left");
    searchMenu.style.top = getposOffset(searchButton, "top") + searchButton.offsetHeight;

    if (searchMenu.style.visibility == "hidden") {
      searchMenu.style.visibility = "visible";
      searchMenu.style.display = 'block';
    } else {
      searchMenu.style.visibility = "hidden";
      searchMenu.style.display = 'none';
    }
  }

function getposOffset(what, offsettype){
  var totaloffset=(offsettype=="left")? what.offsetLeft : what.offsetTop;
  var parentEl=what.offsetParent;
  while (parentEl!=null){
    totaloffset=(offsettype=="left")? totaloffset+parentEl.offsetLeft : totaloffset+parentEl.offsetTop;
    parentEl=parentEl.offsetParent;
  }
  return totaloffset;
}

function ToggleMenuOnOff (menuName) {
    var menu = document.getElementById(menuName);

    if (menu.style.display == 'none') {
      menu.style.display = 'block';
    } else {
      menu.style.display = 'none';
    }

}

function OpenWindow (target) { 
  window.open(target, "_Child", "toolbar=no,scrollbars=yes,resizable=yes,width=400,height=400"); 
}

function OpenPostWindow (target) { 
  window.open(target, "_Child", "resizable=yes,width=500,height=700"); 
}

function ShowEditBlock(block) {
	block.className = "CommonContentPartBorderOn";
}
function HideEditBlock(block) {
	block.className = "CommonContentPartBorderOff";
}

function getCookie(sName) {
	var cookie = "" + document.cookie;
	var start = cookie.indexOf(sName);
	if (cookie == "" || start == -1) 
		return "";
	var end = cookie.indexOf(';',start);
	if (end == -1)
		end = cookie.length;
	return unescape(cookie.substring(start+sName.length + 1,end));
}
function setCookie(sName, value) {
	document.cookie = sName + "=" + escape(value) + ";path=/;";
}
function setCookieForever(sName, value) {
	document.cookie = sName + "=" + escape(value) + ";path=/;expires=Fri, 1 Jan 2010 00:00:00 GMT;";
}

function inLineEditOn(control)
{
    control.className = "CommonInlineEditOn";
}

function inLineEditOff(control)
{
    control.className = "CommonInlineEditOff";
}

//Ajax Start

function Ajax_GetXMLHttpRequest() {
	if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	} else {
		if (window.Ajax_XMLHttpRequestProgID) {
			return new ActiveXObject(window.Ajax_XMLHttpRequestProgID);
		} else {
			var progIDs = ["Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
			for (var i = 0; i < progIDs.length; ++i) {
				var progID = progIDs[i];
				try {
					var x = new ActiveXObject(progID);
					window.Ajax_XMLHttpRequestProgID = progID;
					return x;
				} catch (e) {
				}
			}
		}
	}
	return null;
}
function Ajax_CallBack(type, id, method, args, clientCallBack, debugRequestText, debugResponseText, debugErrors, includeControlValuesWithCallBack, url) {
	
	if (!url)
	{
		url = window.location.href;
		url = url.replace(/\#.*$/, '');
		if (url.indexOf('?') > -1)
			url += "&Ajax_CallBack=true";
		else
		{
			if (url.substr(url.length - 1, 1) == "/")
				url += "default.aspx";
				
			url += "?Ajax_CallBack=true";
		}
	}

	var x = Ajax_GetXMLHttpRequest();
	var result = null;
	if (!x) {
		result = { "value":null, "error": "NOXMLHTTP"};
		if (debugErrors) {
			alert("error: " + result.error);
		}
		if (clientCallBack) {
			clientCallBack(result);
		}
		return result;
	}

	x.open("POST", url, clientCallBack ? true : false);
	x.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
	TelligentUtility.WriteAuthorizationHeader(x);
	if (clientCallBack) {
		x.onreadystatechange = function() {
			var result = null;
		
			if (x.readyState != 4) {
				return;
			}
			
			if (debugResponseText) {
				alert(x.responseText);
			}
			
			try
			{
				result = JSON.parse(x.responseText);
				if (debugErrors && result.error) {
					alert("error: " + result.error);
				}
			}
			catch (err)
			{
			    if (x && x.responseText)
			    {
			        window.alert('The following error occurred while processing an AJAX request: ' + err.message);
				    result = new Object();
				    result.error = 'An AJAX error occurred.  The response is invalid.';
				}
			}
			
			if (result)
			    clientCallBack(result);			
		}
	}
	var encodedData = "Ajax_CallBackType=" + type;
	if (id) {
		encodedData += "&Ajax_CallBackID=" + id.split("$").join(":");
	}
	encodedData += "&Ajax_CallBackMethod=" + method;
	if (args) {
		for (var i in args) {
			encodedData += "&Ajax_CallBackArgument" + i + "=" + encodeURIComponent(args[i]);
		}
	}
	if (includeControlValuesWithCallBack && document.forms.length > 0) {
		var form = document.getElementById('aspnetForm');
		for (var i = 0; i < form.length; ++i) {
			var element = form.elements[i];
			if (element.name) {
				var elementValue = null;
				if (element.nodeName == "INPUT") {
					var inputType = element.getAttribute("TYPE").toUpperCase();
					if (inputType == "TEXT" || inputType == "PASSWORD" || inputType == "HIDDEN") {
						elementValue = element.value;
					} else if (inputType == "CHECKBOX" || inputType == "RADIO") {
						if (element.checked) {
							elementValue = element.value;
						}
					}
				} else if (element.nodeName == "SELECT") {
					elementValue = element.value;
				} else if (element.nodeName == "TEXTAREA") {
					elementValue = element.value;
				}
				if (elementValue) {
					encodedData += "&" + element.name + "=" + encodeURIComponent(elementValue);
				}
			}
		}
	}
	if (debugRequestText) {
		alert(encodedData);
	}
	x.send(encodedData);
	if (!clientCallBack) {
		if (debugResponseText) {
			alert(x.responseText);
		}
		result = eval("(" + x.responseText + ")");
		if (debugErrors && result.error) {
			alert("error: " + result.error);
		}
	}
	delete x;
	return result;
}

//Ajax End

//Element Items Borrowed From Prototype

function $() {
  var elements = new Array();

  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (typeof element == 'string')
      element = document.getElementById(element);

    if (arguments.length == 1) 
      return element;

    elements.push(element);
  }

  return elements;
}


var Element = {
  
  toggle: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      element.style.display = 
        (element.style.display == 'none' ? '' : 'none');
    }
  },

  hide: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      element.style.display = 'none';
    }
  },

  show: function() {
    for (var i = 0; i < arguments.length; i++) {
      var element = $(arguments[i]);
      element.style.display = '';
    }
  },

  remove: function(element) {
    element = $(element);
    element.parentNode.removeChild(element);
  },
   
  getHeight: function(element) {
    element = $(element);
    return element.offsetHeight; 
  }
}


//End Element Items


if (document.addEventListener) {
    window.addEventListener("load", WindowOnload, false);
} else if (document.attachEvent) {
    window.attachEvent("onload", WindowOnload);
}

function WindowOnload(evt) {
    AdjustNavPaneTabs();
}

function AdjustNavPaneTabs() {
    var commonElement = document.getElementById('Common');
    if (commonElement) {
        var commonPanelNav = GetChildElementByClassName(commonElement, "CommonPanelNavigation");
        if (commonPanelNav) {
            var dashboardMenuArea = GetChildElementByClassName(commonPanelNav, "DashboardMenuArea");
            var navPaneTabSet = GetChildElementByClassName(commonPanelNav, "NavPaneTabSet");
            if (dashboardMenuArea && navPaneTabSet && dashboardMenuArea.offsetWidth > navPaneTabSet.offsetLeft) {
                navPaneTabSet.style.marginLeft = dashboardMenuArea.offsetWidth + "px";
            }
        }
    }
}

function GetChildElementByClassName(elem, className) {
    for (var i = 0; i < elem.childNodes.length; i++) {
        if (elem.childNodes[i].className === className) {
            return elem.childNodes[i];
        }
    }
}
