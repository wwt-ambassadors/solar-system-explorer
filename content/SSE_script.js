(function () {
  // The WWT ScriptInterface singleton.
  var wwt_si = null;

  // The WWT WWTControl singleton.
  var wwt_ctl = null;

  // Space Time Controller
  var wwt_stc = null;

  // global variables to hold the wwt_si navigation for the last thumbnail clicked, for use by the reset button
  var reset_enabled = false;
  var curr_name = null;
  var curr_obj = null;
  var thumbnails_loaded = 0;

  // global variable to hold the current rate of time-elapse
  var curr_time = 1;

  // global variable to hold planet size
  var object_size = 25;

  function initialize() {
    // This function call is
    // wwt-web-client/HTML5SDK/wwtlib/WWTControl.cs:WWTControl::InitControlParam.
    // It creates a singleton WWTControl object, accessible here as
    // `wwtlib.WWTControl.singleton`, and returns a singleton
    // ScriptInterface object, also accessible as
    // `wwtlib.WWTControl.scriptInterface`.
    wwt_si = wwtlib.WWTControl.initControlParam(
      "wwtcanvas", // id of the <div> to draw in
      true  // use WebGL!
    );
    wwt_si.add_ready(wwt_ready);
  }

  $(document).ready(initialize);

  function wwt_ready() {
    wwt_ctl = wwtlib.WWTControl.singleton;
    wwt_stc = wwtlib.SpaceTimeController;

    wwt_si.setBackgroundImageByName("Solar System");
    wwt_si.settings.set_solarSystemScale(25);
    wwt_si.settings.set_solarSystemMilkyWay(false);
    wwt_si.settings.set_solarSystemCosmos(false);
    wwt_si.settings.set_solarSystemStars(false);
    wwt_si.settings.set_showConstellationBoundries(false);
    wwt_si.settings.set_showConstellationFigures(false);
    wwt_si.settings.set_showConstellationSelection(false);
    wwt_si.settings.set_showCrosshairs(false);
    setup_controls();

    //(variables defined inside a function are not known to other functions)
    loadWtml(function (folder, xml) {

      // store each of the Place objects from the WTML file in places
      var places = $(xml).find('Place');
      var thumbTemplate = $('<div class="col_thumb"><a href="javascript:void(0)" class="thumbnail border_white"><img src=""/><div class="thumbname">example</div</a></div>');
      var descTemplate = $('<div class="obj_desc container-fluid"><div class="row"><div class="name col-xs-12 col-md-12 col-lg-12">name</div><div class="what col-xs-12 col-md-12 col-lg-12">what</div><div class="characteristics col-xs-12 col-md-12 col-lg-12">characteristics</div></div></div>');
      
      places.each(function (i, pl) {
        var place = $(pl);
        
        // create a temporary object of a thumbnail and of a description element from the templates above 
        var tmpthumb = thumbTemplate.clone();
        var tmpdesc = descTemplate.clone();

        tmpthumb.find('a').attr({
          tabindex: place.attr('Index')
        });

        tmpthumb.find('img').attr({
          src: place.find('ThumbnailUrl').text(),
          class: 'border_black',
          alt: place.attr('Name'),
          'data-toggle': 'tooltip',
          'data-placement': 'top',
          'data-container': 'body',
          title: place.find('Description').attr('Title')
        });

        if (place.attr('Name') == "Sun") {
          tmpthumb.find('img').removeClass("border_black").addClass("border_green");
        }

        // locate the thumbnail name and replace html contents with content from WTML file
        var thumbname = place.find('.Thumbnail').html();
        tmpthumb.find('.thumbname').html(thumbname);

        // grab the class = Name/What/Before/Process/After/Elements/Properties/Dive html content for each Place from the WTML file
        var targetname = place.find('.Name').html();
        tmpdesc.find('.name').html(targetname);

        var targetwhat = place.find('.What').html();
        tmpdesc.find('.what').html(targetwhat);
          
        var targetcharacteristics = place.find('.Characteristics').html();
        tmpdesc.find('.characteristics').html(targetcharacteristics);
    
          
        // apply the unique target description class to the description template clone
        var desc_class = place.find('Target').text().toLowerCase() + "_description";
        tmpdesc.addClass(desc_class);


        // add event listener to every thumbnail element, which listens for single- vs. double-click
        function on_click(element, is_dblclick) {

          if (wwt_si === null) {
            return;
          };

          //	Change the border color of the selected thumbnail
          var element = element;
            
          $(".thumbnail img").removeClass("border_green").addClass("border_black");
          $(".thumbname").removeClass("text_green");
          $(element).parent().find("img").removeClass("border_black").addClass("border_green");
          $(element).parent().find(".thumbname").addClass("text_green");

          // RESET NOT IN USE, NOT NEEDED FOR SSE MODULE
          // enable the reset button (and hide if visible)
          // reset_enabled = true;
          // $("#reset_target").fadeOut(100);

          /* hide all descriptions, reset scrolls, then show description specific to this target on sgl/dbl click */
          var toggle_class = "." + place.find('Target').text().toLowerCase() + "_description";
          $("#description_box").find(".obj_desc").hide();
          $('#begin_container').hide();
          $('#description_container').scrollTop(0).show();
            
          $(toggle_class).show();
            
          // Make arrow appear only for overflow
          var desc_box = $('#description_container')[0];
          
          if(desc_box.scrollHeight > desc_box.clientHeight) {
            //console.log("need arrow");
            $('.fa-arrow-down').show();
          } else {
            $('.fa-arrow-down').hide();
          }

          curr_name = place.attr('Name');

          $.each(folder.get_children(), function (i, wwtplace) {
            if (wwtplace.get_name() == place.attr('Name')) {
              // store the object whose thumbnail was just clicked
              curr_obj = wwtplace;

              wwt_ctl.gotoTarget(
                wwtplace,  // the Place object
                false,  // noZoom -- false means zoom level is set to something "sensible" for the target
                is_dblclick,  // instant -- whether to fly the almost-instantly
                true  // trackObject -- whether to start the camera tracking this object
              );
            }
          });
           
        }

        tmpthumb.find('a')
          .data('foreground-image', place.attr('Name'))
          //'click' - false; 'dblclick' - true.  on('click', function () { on_click(false) });

          .on('click', function(event){
            var element = event.target;
            on_click(element, false)
          })

          .on('dblclick', function(event){
            var element = event.target;
            on_click(element, true)
          });

        tmpdesc.find('a').mouseenter(function() {
          var popup_id = "#" + place.attr('Name').toLowerCase() + "_scale"
          $(popup_id).show();
        })
        tmpdesc.find('a').mouseleave(function() {
          var popup_id = "#" + place.attr('Name').toLowerCase() + "_scale"
          $(popup_id).hide();
        })


        // Plug the set of thumbnails into the #destinationThumbs element
        $('#destinationThumbs').append(tmpthumb);
        thumbnails_loaded = thumbnails_loaded + 1;
        if (thumbnails_loaded == 15) {
          console.log("adding lighting button");
          var lighting_buttons = $('<div class="col_thumb"><div class="thumbnail lighting_buttons"><div class="rl_text">realistic lighting</div><div><i class="fas reallight fa-toggle-on"></i><i class="fas fulllight fa-toggle-off button_hide"></i></div></div></div>');
          $('#destinationThumbs').append(lighting_buttons);
        }

        // TWO EVENT HANDLERS FOR PAT TO EXPERIMENT WITH LIGHTING
        // 1. Full lighting
        $('.fulllight').click(function() {
          $('.fulllight').addClass("button_hide")
          $('.reallight').removeClass('button_hide');

          // FOR PAT TO FILL OUT WITH LIGHTING CODE
          wwt_si.settings.set_solarSystemLighting(true);

        })
      
        // 2. Real Lighting
        $('.reallight').click(function() {
          $('.reallight').addClass("button_hide")
          $('.fulllight').removeClass('button_hide');

          // FOR PAT TO FILL OUT WITH LIGHTING CODE
          wwt_si.settings.set_solarSystemLighting(false);
        })
        
        // Add description to the container
        $("#description_container").append(tmpdesc);

        // tag the reload button with a click action to reload the most recent thumbnail
        $("#reset_target").on('click', function(event){

          console.log("should be resetting...");

          wwt_ctl.gotoTarget(
            curr_obj,  // the Place object
            true,  // noZoom -- false means zoom level is set to something "sensible" for the target
            true,  // instant -- whether to fly the almost-instantly
            true  // trackObject -- whether to start the camera tracking this object
          );

          $("#reset_target").fadeOut(1000);

        })

      });

    });

  };

  // Load data from wtml file
  function loadWtml(callback) {
    var hasLoaded = false;

    //This is what Ron calls getXml
    function getWtml() {
      //console.log("in getWtml function");
      if (hasLoaded) { return; }
      hasLoaded = true;
      $.ajax({
        url: wtmlPath,
        crossDomain: false,
        dataType: 'xml',
        cache: false,
        success: function (xml) {
          callback(wwt_si._imageFolder, xml)
        },
        error: function (a, b, c) {
          console.log({ a: a, b: b, c: c });
        }
      });
    }

    var wtmlPath = "BUACSolarSystem.wtml";
    wwt_si.loadImageCollection(wtmlPath);
    console.log("Loaded Image Collection");
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
    // const new_wwt_width = top_container.width() - 2;
    const new_wwt_height = top_container.height() - 2;  // set wwt_canvas height to fill top_container, subtract 2 to account for border width
    const colophon_height = $("#colophon").height();
    
    const bottom_height = container.height() - top_container.outerHeight() - 80;
    const description_height = bottom_height - colophon_height;

    $("#wwtcanvas").css({
      // "width": new_wwt_width + "px",
      "height": new_wwt_height + "px"
    });

    $("#description_box").css({
      "height": description_height + "px"
    });

  }

  $(document).ready(size_content);
  $(window).resize(size_content);
  // also triggering size_content function in the load_wtml function, because thumbnails aren't loading immediately
    
    



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
      "KeyZ": wheel_up,
      "KeyX": wheel_down,
      90: wheel_up,
      88: wheel_down
    };

    const moveCodes = {
      "KeyJ": mouse_left,
      "KeyI": mouse_up,
      "KeyL": mouse_right,
      "KeyK": mouse_down,
      74: mouse_left,
      73: mouse_up,
      76: mouse_right,
      75: mouse_down
    };

    window.addEventListener("keydown", function (event) {
      // "must check the deprecated keyCode property for Qt"

      // Check whether keyboard events initiate zoom methods
      if (zoomCodes.hasOwnProperty(event.code) || zoomCodes.hasOwnProperty(event.keyCode)) {
        // remove the zoom_pan instructions
        $("#zoom_pan_instrux").delay(5000).fadeOut(1000);

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

        if (event.shiftKey){
          delay = 500; // milliseconds
        }
        else{
          delay = 100;
        }

        setTimeout(function () { proceed = true }, delay);

        if (event.deltaY < 0){
          wwt_ctl.zoom(1.43);
          console.log("zoom level =", wwt_ctl.get_zoom);
        }
        else {
        /*we think this is the zoom out. Adjust this to have a hard outer limit */
          wwt_ctl.zoom(0.7);
          console.log("zoom level =", wwt_ctl.get_zoom);
        }

      }
    })(true));
  }
  
  // when user scrolls to bottom of the description container, remove the down arrow icon. Add it back when scrolling back up.
  $('#description_container').on('scroll', function(event) {
      var element = event.target;
    
    if(element.scrollHeight - element.scrollTop === element.clientHeight) {
      console.log("reached bottom!");
      $('.fa-arrow-down').fadeOut(200);
    }
    else {
      $('.fa-arrow-down').show();
    }
  })
    
  // remove zoom-pan instructions upon canvas click, after a 5 second delay
  $('#wwtcanvas').on('click', function() {
    $("#zoom_pan_instrux").delay(5000).fadeOut(1000);

    // RESET NOT IN USE, NOT NEEDED FOR SSE MODULE
    // if(reset_enabled) {
    //   $("#reset_target").show();
    // }

  })

  // FOUR EVENT HANDLERS FOR PAT TO EXPERIMENT WITH TIME-SCALES
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

    $('#speed').html('REAL TIME');
  })

  // This will become pause/play button - needs to be updated
  // 2. Play/Pause Button (play/pause advancing time)
  $('#playpause_time').on('click', function() {
    if (curr_time != 0) {
      curr_time = 0;
      wwt_stc.set_syncToClock(false);
 //     wwt_stc.set_timeRate(curr_time);
  
      $('#faster_time').removeClass('time_active');
      $('#speed').html('PAUSE');
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

  // 3. Slower Button (advance time more slowly)
  $('#slower_time').on('click', function() {
    // if ($('#speed').html() != ('REAL TIME' | 'PAUSE')) {
      if (curr_time > 1) {
        curr_time = wwt_stc.get_timeRate()/10;
        wwt_stc.set_timeRate(curr_time);
        $('#faster_time').addClass('time_active');

        print_time(curr_time);
      }
      if (curr_time <= 1) {
        $('#slower_time').removeClass('time_active');
      }
    // }
  })

  // 4. Faster Button (advance time more quickly)
  $('#faster_time').on('click', function() {
    // if () {
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
    // }
  })

  $('#speed').html('REAL TIME');

  function print_time(num) {
    console.log("print time");
    if (num==1){
      $('#speed').html('REAL TIME');
    }
    else if (num==10 | num==100) {
      $('#speed').html(num + '<span class="times">&#215;</span>');
    }
    else if (num==1000) {
      $('#speed').html('1,000<span class="times">&#215;</span>');
    }
    else if (num==10000) {
      $('#speed').html('10,000<span class="times">&#215;</span>');
    }
    else if (num==100000) {
      $('#speed').html('100,000<span class="times">&#215;</span>');
    }
    else if (num==1000000) {
      $('#speed').html('1,000,000<span class="times">&#215;</span>');
    }
    else if (num==10000000) {
      $('#speed').html('10,000,000<span class="times">&#215;</span>');
    }
    else if (num==100000000) {
      $('#speed').html('100,000,000<span class="times">&#215;</span>');
    }
    else if (num==1000000000) {
      $('#speed').html('1,000,000,000<span class="times">&#215;</span>');
    }
  }


  // 5. Planet Scale Slider (Planet Size smaller/larger)
  $('#size_slider').slider({
    value: 3,
    min: 1,
    max: 5,
    step: 1,
    slide: function(event, ui) {
      process_planet_scale(ui.value);
    }
  })

  function process_planet_scale(num) {
    console.log("Object size: ", num);
    switch(num) {
      case 1:
        console.log("smallest size");
        object_size = 1;
        wwt_si.settings.set_solarSystemScale(object_size);
        break;
      case 2:
        console.log("medium size" + object_size);
        object_size = 10;
        wwt_si.settings.set_solarSystemScale(object_size); 
        break;
      case 3:
        console.log("biggish size");
        object_size = 25;
        wwt_si.settings.set_solarSystemScale(object_size); 
        break;
      case 4:
        console.log("bigger size");
        object_size = 50;
        wwt_si.settings.set_solarSystemScale(object_size); 
        break;
      case 5:
        console.log("biggest size");
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
  $("#size").html(object_size + '<span class="times">&#215;</span>');
  process_planet_scale(object_size);

})();
