(function () {
  // The WWT ScriptInterface singleton.
  var wwt_si = null;

  // The WWT WWTControl singleton.
  var wwt_ctl = null;

  // Space Time Controller
  var wwt_stc = null;

  // global variables to identify number of thumbnails loaded, to determine when to populate realistic lighting button
  var thumbnails_loaded = 0;

  // global variable to hold the current rate of time-elapse / planet size / real lighting
  var curr_time = 1;
  var object_size = 25;
  var real_lighting = true;

  // global variable for popup clicks
  var popup_open = false;

  // The WWT `Folder` instance for our WTML collection
  var wwt_folder = null;

  // function to start off with when $(document).ready() takes off
  function initialize() {
    // This function call is
    // wwt-web-client/HTML5SDK/wwtlib/WWTControl.cs:WWTControl::InitControlParam.
    // It creates a singleton WWTControl object, accessible here as
    // `wwtlib.WWTControl.singleton`, and returns a singleton
    // ScriptInterface object, also accessible as
    // `wwtlib.WWTControl.scriptInterface`.
    /**
    Replaced initControl with this alternate version that allows for different starting angles for the Solar System. 
    */
    wwt_si = wwtlib.WWTControl.initControl6(
      "wwtcanvas",
      true,
      30,
      30,
      240,
      "SolarSystem"
    );
    wwt_si.add_ready(wwt_ready);
  }

  // Execute on load of DOM
  $(document).ready(initialize);


  // If you can follow the logic above, it'll get here, and this is where the action really happens
  function wwt_ready() {
    wwt_ctl = wwtlib.WWTControl.singleton;
    wwt_stc = wwtlib.SpaceTimeController;

    // apply initial WWT settings
    wwt_si.setBackgroundImageByName("Solar System");
    wwt_si.settings.set_solarSystemScale(25);
    wwt_si.settings.set_solarSystemMilkyWay(true);
    wwt_si.settings.set_solarSystemCosmos(true);
    wwt_si.settings.set_solarSystemStars(true);
    wwt_si.settings.set_showConstellationBoundries(false);
    wwt_si.settings.set_showConstellationFigures(false);
    wwt_si.settings.set_showConstellationSelection(false);
    wwt_si.settings.set_showCrosshairs(false);
    setup_controls();

    //(variables defined inside a function are not known to other functions)
    loadWtml(function (xml) {

      // store each of the Place objects from the WTML file in places
      var places = $(xml).find('Place');
      // create templates of the thumbnail and the description text to clone from
      var thumbTemplate = $('<div class="col_thumb"><a href="javascript:void(0)" class="thumbnail border_white"><img src=""/><div class="thumbname">example</div</a></div>');
      var descTemplate = $('<div class="obj_desc container-fluid"><div class="row"><div class="name col-xs-12 col-md-12 col-lg-12">name</div><div class="what col-xs-12 col-md-12 col-lg-12">what</div><div class="characteristics col-xs-12 col-md-12 col-lg-12">characteristics</div></div></div>');
      

      // iterate fully through each places object
      places.each(function (i, pl) {
        var place = $(pl);
        
        // create a temporary object of a thumbnail and of a description element from the templates above 
        var tmpthumb = thumbTemplate.clone();
        var tmpdesc = descTemplate.clone();


        // find the <a> element for the thumbnail -- and specify the tab-accessibility index from the wtml
        tmpthumb.find('a').attr({
          tabindex: place.attr('Index')
        });

        // find the <img> element for the thumbnail, and set some attributes/css
        tmpthumb.find('img').attr({
          src: place.find('ThumbnailUrl').text(),
          class: 'border_black',
          alt: place.attr('Name'),
          'data-toggle': 'tooltip',
          'data-placement': 'top',
          'data-container': 'body',
          title: place.find('Description').attr('Title')
        });

        // Set the Sun thumbnail to green border selection, since the solar system loads centered on the Sun (this does not mean Sun description has loaded as well)
        if (place.attr('Name') == "Sun") {
          tmpthumb.find('img').removeClass("border_black").addClass("border_green");
        }

        // locate the thumbnail name text-field and replace html contents with content from WTML file
        var thumbname = place.find('.Thumbnail').html();
        tmpthumb.find('.thumbname').html(thumbname);


        // grab the class = Name/What/Characteristics html content for each Place from the WTML file
        var targetname = place.find('.Name').html();
        tmpdesc.find('.name').html(targetname);

        var targetwhat = place.find('.What').html();
        tmpdesc.find('.what').html(targetwhat);
          
        var targetcharacteristics = place.find('.Characteristics').html();
        tmpdesc.find('.characteristics').html(targetcharacteristics);
    
          
        // apply the unique target description class to the description template clone
        var desc_class = place.find('Target').text().toLowerCase() + "_description";
        tmpdesc.addClass(desc_class);


        // click functions - add event listener to every thumbnail element, which listens for single- vs. double-click
        function on_click(element, is_dblclick) {

          // ignore if wwt_si hasn't initialized yet
          if (wwt_si === null) {
            return;
          };

          // this creates a variable to hold the element clicked
          var element = element;
            
          //	Change the border color of the selected thumbnail
          $(".thumbnail img").removeClass("border_green").addClass("border_black");
          $(".thumbname").removeClass("text_green");
          $(element).parent().find("img").removeClass("border_black").addClass("border_green");
          $(element).parent().find(".thumbname").addClass("text_green");

          /* hide all descriptions, then show description specific to this target on sgl/dbl click , scrolled to top */
          $("#description_box").find(".obj_desc").hide();
          $('#description_container').scrollTop(0);
            
          var toggle_class = "." + place.find('Target').text().toLowerCase() + "_description";
          $(toggle_class).show();
            
          
          // Make scroll arrow appear only for overflow
          var desc_box = $('#description_container')[0];
          
          if(desc_box.scrollHeight > desc_box.clientHeight) {
            $('.fa-arrow-down').show();
          } else {
            $('.fa-arrow-down').hide();
          }


          // hide all object scale image popups (including new_horizons)
          $(".scale_popup").hide();
          popup_open = false;

          
          // identify from WTML file where WWT should fly to (and parse click-type)
          $.each(wwt_folder.get_children(), function (i, wwtplace) {
            if (wwtplace.get_name() == place.attr('Name')) {
              wwt_ctl.gotoTarget(
                wwtplace,  // the Place object
                false,  // noZoom -- false means zoom level is set to something "sensible" for the target
                is_dblclick,  // instant -- whether to fly the almost-instantly
                true  // trackObject -- whether to start the camera tracking this object
              );
            };
          });
           
        };


        // attach click events to thumbnails to trigger the on_click function (defined above)
        tmpthumb.find('a')
          .data('foreground-image', place.attr('Name'))
          // specify different functionality for click vs. dblclick
          .on('click', function(event){
            var element = event.target;
            on_click(element, false)
          })
          .on('dblclick', function(event){
            var element = event.target;
            on_click(element, true)
          });

        // pop up image of object scale, using click methods
        var popup_id = "#" + place.attr('Name').toLowerCase() + "_scale";
        tmpdesc.find('.scalelink').click(function() {
          $('#new_horizons').hide();
          if (popup_open) {
            $(popup_id).hide();
          }
          else {
            $(popup_id).show();
            $(popup_id).find('.close_scale').focus();
          }
          popup_open = !(popup_open);
        });

        // account for the new_horizons image in the Pluto description text (note: this is not the most elegant way of adding to code)
        tmpdesc.find('#new_horizons_popup').click(function() {
          if (popup_open) {
            $('.scale_popup').hide();
            popup_open = !(popup_open);
          }
          $('#new_horizons').toggle();
        });


        // Plug the set of thumbnails into the #destinationThumbs element
        $('#destinationThumbs').append(tmpthumb);
        // check whether all the thumbnails have loaded (which is hard-coded as 15), at which point populate in the lighting buttons
        thumbnails_loaded = thumbnails_loaded + 1;
        if (thumbnails_loaded == 15) {
          var lighting_buttons = $('<div class="col_thumb"><div class="thumbnail lighting_buttons"><div class="rl_text">realistic lighting</div><div class="lighting_toggle" tabindex="16"><i class="fas reallight fa-toggle-on"></i><i class="fas fulllight fa-toggle-off button_hide"></i></div></div></div>');
          $('#destinationThumbs').append(lighting_buttons);
        };
        
        // Add description to the desc_container
        $("#description_container").append(tmpdesc);

        
        // Lighting - click Events, toggle between the two icons
        $('.lighting_toggle').click(function() {
          $('.fulllight').toggleClass("button_hide")
          $('.reallight').toggleClass("button_hide");

          real_lighting = !(real_lighting);
          wwt_si.settings.set_solarSystemLighting(real_lighting);
        })

        // Lighting - Keydown Events, toggle with focus (key event 13 represents "enter")
        $('.lighting_toggle').keydown(function() {
          if (event.which == 13) {
            $('.fulllight').toggleClass("button_hide")
            $('.reallight').toggleClass("button_hide");

            real_lighting = !(real_lighting);
            wwt_si.settings.set_solarSystemLighting(real_lighting);
          }
        })

      });
    });
  };



  // Load data from wtml file
  function loadWtml(callback) {
    var hasLoaded = false;

    //This is what Ron calls getXml
    function getWtml() {
      if (hasLoaded) { return; }
      hasLoaded = true;
      $.ajax({
        url: wtmlPath,
        crossDomain: false,
        dataType: 'xml',
        cache: false,
        success: function (xml) {
          callback(xml)
        },
        error: function (a, b, c) {
          console.log({ a: a, b: b, c: c });
        }
      });
    }

    // Load the image collection. This is an asynchronous action; wwt_folder
    // won't actually be populated until the HTTP request is answered and
    // we process the folder contents.
    var wtmlPath = "BUACSolarSystem.wtml";
    wwt_folder = wwtlib.Wtml.getWtmlFile(wtmlPath, function () { }, false);
    console.log("Loading Image Collection");
    getWtml();
    setTimeout(function () {
      getWtml();
    }, 1500);
    //trigger size_content function again after thumbnails have started loading
    setTimeout(function() {
        size_content();
    }, 500);
    //trigger size_content function a second time after thumbnails have started loading
    setTimeout(function() {
        size_content();
    }, 3000);
  };


  // Backend details: auto-resizing the WWT canvas.

  function size_content() {
    var container = $("html");
    var top_container = $(".top_container");

    // Constants here must be synced with settings in style.css
    const new_wwt_height = top_container.height() - 2;
    // set wwt_canvas height to fill top_container, subtract 2 to account for border width

    const colophon_height = $("#colophon").height();
    
    const bottom_height = container.height() - top_container.outerHeight() - 80;
    const description_height = bottom_height - colophon_height;

    // resize wwtcanvas with new values
    $("#wwtcanvas").css({
      "height": new_wwt_height + "px"
    });

    // resize description box to new value
    $("#description_box").css({
      "height": description_height + "px"
    });

  }

  $(document).ready(size_content);
  $(window).resize(size_content);
  // also triggering size_content function in the load_wtml function,
  // because thumbnails aren't loading immediately
    
    

  // Backend details: setting up keyboard controls.
  //
  // TODO: this code is from pywwt and was designed for use in Jupyter;
  // we might be able to do something simpler here.

  function setup_controls() {
    var canvas = document.getElementById("wwtcanvas");

    function new_event(action, attributes, deprecated) {
      if (!deprecated) {
        var event = new CustomEvent(action);
      } else {
        var event = document.createEvent("CustomEvent");
        event.initEvent(action, false, false);
      }

      if (attributes) {
        for (var attr in attributes)
          event[attr] = attributes[attr];
      }

      return event;
    }

    const wheel_up = new_event("wwt-zoom", { deltaY: 53, delta: 53 }, true);
    const wheel_down = new_event("wwt-zoom", { deltaY: -53, delta: -53 }, true);
    const mouse_left = new_event("wwt-move", { movementX: 53, movementY: 0 }, true);
    const mouse_up = new_event("wwt-move", { movementX: 0, movementY: 53 }, true);
    const mouse_right = new_event("wwt-move", { movementX: -53, movementY: 0 }, true);
    const mouse_down = new_event("wwt-move", { movementX: 0, movementY: -53 }, true);

    const zoomCodes = {
      "KeyI": wheel_up,
      "KeyO": wheel_down,
      73: wheel_up,
      79: wheel_down
    };

    const moveCodes = {
      "KeyA": mouse_left,
      "KeyW": mouse_up,
      "KeyD": mouse_right,
      "KeyS": mouse_down,
      65: mouse_left,
      87: mouse_up,
      68: mouse_right,
      83: mouse_down
    };

    window.addEventListener("keydown", function (event) {
      // "must check the deprecated keyCode property for Qt"

      // Check whether keyboard events initiate zoom methods
      if (zoomCodes.hasOwnProperty(event.code) || zoomCodes.hasOwnProperty(event.keyCode)) {
        // remove the zoom_pan instructions
        $("#zoom_pan_instrux").delay(5000).fadeOut(1000);
        $("#page_title").delay(5000).fadeOut(1000);
        
        var action = zoomCodes.hasOwnProperty(event.code) ? zoomCodes[event.code] : zoomCodes[event.keyCode];

        if (event.shiftKey)
          action.shiftKey = 1;
        else
          action.shiftKey = 0;

        canvas.dispatchEvent(action);
      }

      // Check whether keyboard events initiate move methods
      if (moveCodes.hasOwnProperty(event.code) || moveCodes.hasOwnProperty(event.keyCode)) {
        // remove the zoom_pan instructions
        $("#zoom_pan_instrux").delay(5000).fadeOut(1000);
        $("#page_title").delay(5000).fadeOut(1000);

        var action = moveCodes.hasOwnProperty(event.code) ? moveCodes[event.code] : moveCodes[event.keyCode];

        if (event.shiftKey)
          action.shiftKey = 1
        else
          action.shiftKey = 0;

        if (event.altKey)
          action.altKey = 1;
        else
          action.altKey = 0;

        canvas.dispatchEvent(action);
      }
    });

    canvas.addEventListener("wwt-move", (function (proceed) {
      return function (event) {
        if (!proceed)
          return false;

        if (event.shiftKey)
          delay = 500; // milliseconds
        else
          delay = 100;

        setTimeout(function () { proceed = true }, delay);

        if (event.altKey)
          wwt_ctl._tilt(event.movementX, event.movementY);
        else
          wwt_ctl.move(event.movementX, event.movementY);
      }
    })(true));

    canvas.addEventListener("wwt-zoom", (function (proceed) {
      return function (event) {
        if (!proceed)
          return false;

        if (event.shiftKey)
          delay = 500; // milliseconds
        else
          delay = 100;

        setTimeout(function () { proceed = true }, delay);

        if (event.deltaY < 0){
          wwt_ctl.zoom(1.43);
        }
        else {
          wwt_ctl.zoom(0.7);
        }

      }
    })(true));
  }
  
  // when user scrolls to bottom of the description container, remove the down arrow icon. Add it back when scrolling back up.
  $('#description_container').on('scroll', function(event) {
    var element = event.target;
    
    if(element.scrollHeight - element.scrollTop === element.clientHeight) {
      $('.fa-arrow-down').fadeOut(200);
    }
    else {
      $('.fa-arrow-down').show();
    }
  })
    
  // remove zoom-pan instructions upon canvas click, after a 5 second delay
  $('#wwtcanvas').on('click', function() {
    $("#zoom_pan_instrux").delay(5000).fadeOut(1000);
    $("#page_title").delay(5000).fadeOut(1000);
  })

  // FOUR EVENT HANDLERS FOR TIME-RATES
  // 1. Reset Button (return to present time)
  $('#reset_time').on('click', function() {
    wwt_stc.set_syncToClock(true); 
    curr_time = 1;
    wwt_stc.set_timeRate(curr_time);
    var now = new Date();
    wwt_stc.set_now(now);

    $('#reset_time').removeClass('time_active').addClass('text_orange');
    $('#playpause').removeClass('fa-play').addClass('fa-pause');
    $('#slower_time').removeClass('time_active');
    $('#faster_time').addClass('time_active');

    $('#time_rate').html('REAL TIME');
  })

  // 2. Play/Pause Button (play/pause advancing time)
  $('#playpause_time').on('click', function() {
    if (curr_time != 0) {
      curr_time = 0;
      wwt_stc.set_syncToClock(false);
  
      $('#faster_time').removeClass('time_active');
      $('#time_rate').html('PAUSE');
    }
    else {
      curr_time = 1;
      wwt_stc.set_syncToClock(true); 
      wwt_stc.set_timeRate(curr_time);

      $('#faster_time').addClass('time_active');
      print_time(curr_time);
    }
    $('#slower_time').removeClass('time_active');
    $('#playpause').toggleClass('fa-play').toggleClass('fa-pause');
    $('#reset_time').removeClass('text_orange').addClass('time_active');
  })

  // 3. Slower Button (advance time more slowly; min out at real time)
  $('#slower_time').on('click', function() {
    if (curr_time > 1) {
      curr_time = wwt_stc.get_timeRate()/10;
      wwt_stc.set_timeRate(curr_time);
      $('#faster_time').addClass('time_active');

      print_time(curr_time);
    }
    if (curr_time <= 1) {
      $('#slower_time').removeClass('time_active');
    }
  })

  // 4. Faster Button (advance time more quickly; max out at 1,000,000,000x)
  $('#faster_time').on('click', function() {
    if (curr_time > 0 && curr_time < 1000000000) {
      curr_time = wwt_stc.get_timeRate()*10;
      wwt_stc.set_timeRate(curr_time);
      $('#slower_time').addClass('time_active');
      $('#reset_time').removeClass('text_orange').addClass('time_active');

      print_time(curr_time);
    }
    if (curr_time >= 1000000000) {
      $('#faster_time').removeClass('time_active');
    }
  })

  // Initialize the time_rate readout to REAL TIME, since that's what WWT does
  $('#time_rate').html('REAL TIME');

  // Print the current time rate to the time_rate readout depending on the backend value (could be simplified to a switch statement)
  function print_time(num) {
    if (num==1){
      $('#time_rate').html('REAL TIME');
    }
    else if (num==10 | num==100) {
      $('#time_rate').html(num + '<span class="times">&#215;</span>');
    }
    else if (num==1000) {
      $('#time_rate').html('1,000<span class="times">&#215;</span>');
    }
    else if (num==10000) {
      $('#time_rate').html('10,000<span class="times">&#215;</span>');
    }
    else if (num==100000) {
      $('#time_rate').html('100,000<span class="times">&#215;</span>');
    }
    else if (num==1000000) {
      $('#time_rate').html('1,000,000<span class="times">&#215;</span>');
    }
    else if (num==10000000) {
      $('#time_rate').html('10,000,000<span class="times">&#215;</span>');
    }
    else if (num==100000000) {
      $('#time_rate').html('100,000,000<span class="times">&#215;</span>');
    }
    else if (num==1000000000) {
      $('#time_rate').html('1,000,000,000<span class="times">&#215;</span>');
    }
  }

  // Planet Scale Slider (Planet Size smaller/larger)
  $('#size_slider').slider({
    value: 3,
    min: 1,
    max: 5,
    step: 1,
    slide: function(event, ui) {
      process_planet_scale(ui.value);
    }
  })

  // Set up a switch statement for the different possible values on the slider,
  // then print to the object_size readout
  function process_planet_scale(num) {
    switch(num) {
      case 1:
        object_size = 1;
        wwt_si.settings.set_solarSystemScale(object_size);
        break;
      case 2:
        object_size = 10;
        wwt_si.settings.set_solarSystemScale(object_size); 
        break;
      case 3:
        object_size = 25;
        wwt_si.settings.set_solarSystemScale(object_size); 
        break;
      case 4:
        object_size = 50;
        wwt_si.settings.set_solarSystemScale(object_size); 
        break;
      case 5:
        object_size=100;
        wwt_si.settings.set_solarSystemScale(object_size); 
        break;
    }
    if (object_size == 1) {
      $("#size").html("TRUE SCALE");
    }
    else {
      $("#size").html(object_size + '<span class="times">&#215;</span>');
    }
  }

  // Initialize the object_size readout to the hardcoded initial value
  process_planet_scale(object_size);


  // Close scale popups when clicking the close icon
  $(".close_scale").click(function() {
    $(".scale_popup").hide();
    popup_open = false;
  })
  
  // All for closing of modal or popups with 'esc' key
  $(document).keydown(function(e) {
    var key = e.which;
    if (key == 27) {
      $(".scale_popup").hide();
      $("#tipsModal").modal('hide');
    }
  })

})();
