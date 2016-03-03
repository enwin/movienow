(function(window, document, exportName, undefined) {
  'use strict';

  var Tablist = function( selector, options ){

    // close all tabs
    function closeTabs( tablist, silent ){
      if( !tablist.openedTab.length ){
        return;
      }

      var openedTab = [].slice.call( tablist.openedTab );

      openedTab.forEach( function( tab ){
        if( silent ){
          toggleDisplay( tab );
        }
        else{
          tab.click();
        }
      } );
    }

    // toggle display of the tabPanel
    function handleDisplay( e ){
      e.preventDefault();

      var tab = e.currentTarget;

      toggleDisplay( tab );

    }

    // ensure that the current tab index is the one matching the tabPanel
    function handlePanelFocus( e ){
      e.preventDefault();

      if( e.target.doubleFocus ){
        delete e.target.doubleFocus;
        return;
      }

      var tabPanel = e.currentTarget,
          tab;

      tab = tabPanel.tab;

      tabPanel.tablist.currentTabIndex = tabPanel.tablist.tabs.indexOf( tab );

      // prevent double focus when the inputs are focused
      if( [ 'radio', 'checkbox' ].indexOf( e.target.type ) >= 0 ){
        e.target.doubleFocus = true;
      }
    }

    // update the current tab index before selecting the current tab
    function handleFocus( e ){
      var tab = e.currentTarget,
          tablist = tab.tablist;

      tablist.currentTabIndex = tablist.tabs.indexOf( tab );

      select( tablist.tabs[ tablist.currentTabIndex ] );

    }

    function handlePanel( e ){
      var tabPanel = e.currentTarget;

      switch( e.keyCode ){
        case 33: // ctrl + page up
          if( e.ctrlKey ){
            e.preventDefault();
            switchTab( tabPanel.tab, tabPanel.tablist.currentTabIndex - 1 );
          }
          break;
        case 34: // ctrl + page down
          if( e.ctrlKey ){
            e.preventDefault();
            switchTab( tabPanel.tab, tabPanel.tablist.currentTabIndex + 1 );
          }
          break;
        // focus back to tab
        case 38: // ctrl + up
          if( e.ctrlKey ){
            e.preventDefault();
            switchTab( tabPanel.tab, tabPanel.tablist.currentTabIndex );
          }
          break;
      }
    }

    function handleTab( e ){
      var tab = e.currentTarget;

      switch( e.keyCode ){
        case 32:
        case 13:
          handleDisplay( e );
          break;
        case 35: // end
          e.preventDefault();
          switchTab( tab, tab.tablist.tabs.length - 1 );
          break;
        case 36: // home
          e.preventDefault();
          switchTab( tab, 0 );
          break;
        case 37: // left
        case 38: // up
          e.preventDefault();
          switchTab( tab, tab.tablist.currentTabIndex - 1 );
          break;
        case 39: // right
        case 40: // down
          e.preventDefault();
          switchTab( tab, tab.tablist.currentTabIndex + 1 );
          break;
      }
    }
    // accordions:
    function init(){
      var tablists;

      if( !selector ){
        tablists = document.querySelectorAll( '[role=tablist]' );
      }
      else if( 'string' === typeof selector ){
        tablists = document.querySelectorAll( selector );
      }
      else{
        tablists = selector;
      }

      if( tablists && !tablists.length ){
        tablists = [ tablists ];
      }
      else{
        tablists = [].slice.call( tablists );
      }

      tablists.forEach( function( tablist ){
        // build tablists references
        setTablist( tablist );
      } );
    }

    // update tab attributes
    function select( tabToSelect ){
      tabToSelect.tablist.tabs.forEach( function( tab ){
        if( tabToSelect === tab ){
          tab.focus();
          tab.setAttribute( 'aria-selected', true );
          tab.setAttribute( 'tabindex', 0 );

          if( null === tabToSelect.tablist.multiselectable ){
            toggleDisplay( tab );
          }
        }
        else{
          tab.setAttribute( 'aria-selected', false );
          tab.setAttribute( 'tabindex', -1 );
        }
      } );
    }

    function setTablist( tablist ){
      var openedTab;
      tablist.tabs = [];
      tablist.tabPanels = [];
      tablist.openedTab = [];

      tablist.multiselectable = tablist.attributes[ 'aria-multiselectable' ] ? tablist.attributes[ 'aria-multiselectable' ].value === 'true' : null;

      [].forEach.call( tablist.querySelectorAll( '[role=tab]' ), function( tab ){
        openedTab = false;
        tab.tablist = tablist;
        tab.tabPanel = document.getElementById( tab.getAttribute( 'aria-controls' ) );
        tab.tabPanel.tablist = tablist;
        tab.tabPanel.tab = tab;

        // set the tab as opened if aria-expanded = true and theres no other tab open
        if( tab.getAttribute( 'aria-expanded' ) === 'true' ){
          if( tablist.multiselectable || (!tablist.multiselectable && !tablist.openedTab.length ) ){
            tablist.openedTab.push( tab );
            openedTab = true;
          }
        }

        tab.setAttribute( 'tabindex', openedTab && 2 > tablist.openedTab.length ? 0 : -1 );
        tab.setAttribute( 'aria-expanded', openedTab );
        tab.setAttribute( 'aria-selected', openedTab );
        tab.tabPanel.setAttribute( 'aria-hidden', !openedTab );

        tablist.tabs.push( tab );
        tablist.tabPanels.push( tab.tabPanel );
      } );

      tablist.tabsLength = tablist.tabs.length;
      tablist.tabPanelsLength = tablist.tabPanels.length;

      if( !tablist.openedTab.length ){
        tablist.openedTab.push( tablist.tabs[ 0 ] );
        tablist.tabPanels[ 0 ].tab.setAttribute( 'tabindex', 0 );
        tablist.tabPanels[ 0 ].tab.setAttribute( 'aria-expanded', 'true' );
        tablist.tabPanels[ 0 ].tab.setAttribute( 'aria-selected', 'true' );
        tablist.tabPanels[ 0 ].setAttribute( 'aria-hidden', 'false' );
      }
    }

    // move the the tab having the index
    function switchTab( tab, index ){
      var tablist = tab.tablist;

      tablist.currentTabIndex = index;

      if( tablist.currentTabIndex < 0 ){
        tablist.currentTabIndex = tablist.tabsLength - 1;
      }
      else if( tablist.currentTabIndex >= tablist.tabsLength ){
        tablist.currentTabIndex = 0;
      }
      tablist.tabs[ tablist.currentTabIndex ].focus();

    }

    function toggleDisplay( tab ){
      var tablist = tab.tablist,
          tabPanel,
          expanded,
          openedIndex;

      tabPanel = tab.tabPanel;
      expanded = tab.getAttribute( 'aria-expanded' ) === "true";

      // force the opening for tabs not accordions
      if( null === tablist.multiselectable ){
        expanded = false;
      }

      if( expanded ){
        openedIndex = tablist.openedTab.indexOf( tab );
        tablist.openedTab.splice( openedIndex, 1 );
      }
      else{

        if( !tablist.multiselectable ){
          tablist.openedTab.forEach( function( openedTab ){
            openedTab.setAttribute( 'aria-expanded', false );
            openedTab.tabPanel.setAttribute( 'aria-hidden', true );
          } );

          tablist.openedTab.length = 0;
        }

        tablist.openedTab.push( tab );
      }

      tab.setAttribute( 'aria-expanded', !expanded );
      tabPanel.setAttribute( 'aria-hidden', expanded );

    }

    init();

    return {
      init: init,
      tabKey: handleTab,
      tabFocus: handleFocus,
      tabAction: handleDisplay,
      panelKey: handlePanel,
      panelFocus: handlePanelFocus,
      closeAll: closeTabs
    };
  };


  if (typeof define == 'function' && define.amd) {
    define(function() {
      return Tablist;
    });
  } else if (typeof module != 'undefined' && module.exports) {
    module.exports = Tablist;
  } else {
    window[exportName] = Tablist;
  }

})(window, document, 'Tablist');
