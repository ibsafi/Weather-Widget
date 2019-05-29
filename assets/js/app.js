weather = {

    is_render: false,
    is_ready: 0,
    is_error: false,
    temp_id: 1,
    req_types: [
        "weather",
        "forecast"
    ],
    timezone: moment().utcOffset(),
    api_id: "7d36d14baace284abfebba91ff8a371f",
    city: {
        name: "toronto",
        coord: {
            lon: 0,
            lat: 0
        },
        country: "CA",
    },
    my_coord: {
        lon: 0,
        lat: 0
    },
    icon_mapping: {
        "01d": "1",
        "01n": "18",
        "02d": "2",
        "02n": "19",
        "03d": "3",
        "03n": "20",
        "04d": "4",
        "04n": "21",
        "09d": "6",
        "09n": "23",
        "10d": "30",
        "10n": "31",
        "11d": "7",
        "11n": "24",
        "13d": "14",
        "13n": "26",
        "50d": "17",
        "50n": "17",
    },
    current: {
        temp: 0,
        temp_max: 0,
        temp_min: 0,
        pressure: 0,
        humidity: 0,
        clouds: 0,
        sunrise: 0,
        sunset: 0,
        wind: { speed: 0, deg: 0 },
        dt: 0,
        state: [
            {
                main: "",
                description: "",
                icon: "1",
            }
        ],
    },
    forecast_page: 0,
    forecast: [
        {
            temp: 0,
            temp_max: 0,
            temp_min: 0,
            pressure: 0,
            humidity: 0,
            clouds: 0,
            wind: { speed: 0, deg: 0 },
            dt: 0,
            state: [
                {
                    main: "",
                    description: "",
                    icon: "1",
                }
            ],
        },
    ],
    capitaize: function (string) {
        string = string.split(" ");
        for (var key in string) {
            string[key] = string[key].charAt(0).toUpperCase() + string[key].slice(1);
        }
        return string.join(" ");
    },
    initialize: function () {

        weather.update('city');
        weather.GeoWeather();

    },
    GeoWeather: function () {

        if (weather.my_coord.lat === 0) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function (position) {
                    weather.my_coord = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    };
                    weather.update('geo');
                });
            }
        }
    },
    update: function (type) {
        weather.is_error = false;
        weather.is_ready = 2;

        for (var key in weather.req_types) {

            options = {
                url: "https://api.openweathermap.org/data/2.5/" + weather.req_types[key],
                method: "GET"
            };
            switch (type) {
                case "city":
                    options.url += "?q=" + weather.city.name + "&appid=" + weather.api_id;
                    $(".fa-map-marker-alt").removeClass("selected");
                    break;
                case "geo":
                    options.url += "?lat=" + weather.my_coord.lat + "&lon=" + weather.my_coord.lon + "&appid=" + weather.api_id;
                    $(".fa-map-marker-alt").addClass("selected");
                    break;
                case "geocity":
                    options.url += "?lat=" + weather.city.coord.lat + "&lon=" + weather.city.coord.lon + "&appid=" + weather.api_id;
                    break;
            }

            $.ajax(options).then(function (results) {
                weather.api_handler(results);
            })
                .catch(function (error) {
                    console.log(error);
                    weather.is_error = true;
                });
        }
    },
    api_handler: function (response) {
        if (response.cnt === null || response.cnt === undefined) {
            //detect the climate response
            weather.current = {
                temp: response.main.temp - 273.15,
                temp_max: response.main.temp_max - 273.15,
                temp_min: response.main.temp_min - 273.15,
                pressure: response.main.pressure,
                humidity: response.main.humidity,
                clouds: response.clouds.all,
                sunrise: response.sys.sunrise,
                sunset: response.sys.sunset,
                wind: response.wind,
                dt: response.dt,
                state: [],
            };

            response.weather.forEach(function (item, index) {
                weather.current.state[index] = {
                    main: item.main,
                    description: item.description,
                    icon: weather.icon_mapping[item.icon]
                }
            });
            if (response.coord.lat !== weather.city.coord.lat) {
                weather.city.name = response.name;
                weather.city.coord = response.coord;
                weather.city.country = response.sys.country;
            }
        } else {
            // detect forecast response
            weather.forecast = [];

            response.list.forEach(function (item, index) {
                weather.forecast[index] = {
                    temp: item.main.temp - 273.15,
                    temp_max: item.main.temp_max - 273.15,
                    temp_min: item.main.temp_min - 273.15,
                    pressure: item.main.pressure,
                    humidity: item.main.humidity,
                    clouds: item.clouds.all,
                    wind: item.wind,
                    dt: item.dt,
                    state: [],
                };

                item.weather.forEach(function (info, id) {
                    weather.forecast[index].state[id] = {
                        main: info.main,
                        description: info.description,
                        icon: weather.icon_mapping[info.icon]
                    };
                });

            });
        }
        weather.is_ready--;
        if (weather.is_ready === 0) {
            weather.is_error = false;
            if (weather.is_render === false) {
                weather.is_render = true;
                weather.render();
            }
            weather.forecast_page = 0;
            weather.update_fcst();
            weather.update_climate();
            weather.resize();
        }
    },
    handle_click: function (event) {

        event.preventDefault();
        if ($(this).attr("req-type") !== 'edit') {
            weather.showsetting(false);
        }

        switch ($(this).attr("req-type")) {
            case "c":
                if (weather.temp_id === 0) {
                    weather.temp_id = 1;
                }
                break;

            case "f":
                if (weather.temp_id === 1) {
                    weather.temp_id = 0;
                }
                break;

            case "next":
                if (weather.forecast_page < Math.round(weather.forecast.length / 8) - 1) {
                    weather.forecast_page++;
                } else {
                    weather.forecast_page = Math.round(weather.forecast.length / 8) - 1;
                }
                break;

            case "prev":
                if (weather.forecast_page > 0) {
                    weather.forecast_page--;
                } else {
                    weather.forecast_page = 0;
                }
                break;

            case "update":
                weather.update('geocity');
                break;

            case 'geo':
                if (weather.my_coord.lat === 0) {
                    weather.GeoWeather();
                } else {
                    weather.update('geo');
                }
                break;

            case "edit":
                if ($('.drop').attr("class").split('show').length === 1) {
                    weather.showsetting(true);
                } else {
                    weather.showsetting(false);
                }
                break;

            case "cancel":
                break;

            case "save":
                var is_update = false;
                var new_city = $('#city').val();
                var new_api_id = $('#api_id').val();
                var new_timezone = parseInt($('#timezone').val()) * 60;

                if (weather.city.name.toLowerCase() !== new_city.toLowerCase()) {
                    weather.city.name = weather.capitaize(new_city);
                    is_update = true;
                }
                if (weather.api_id !== new_api_id) {
                    weather.api_id = new_api_id;
                    is_update = true;
                }
                if (weather.timezone !== new_timezone) {
                    weather.timezone = new_timezone;
                }
                if (is_update) {
                    weather.forecast_page = 0;
                    weather.update('city');
                }
                break;
        }
        if (weather.is_error) {
            weather.update('geo');
        } else {
            weather.update_climate();
            weather.update_fcst();
            weather.resize();
        }

    },
    showsetting: function (is_show) {
        if (is_show) {
            $('.dropdown-toggle').dropdown('show');
            $('span.show').addClass("show");
        } else {
            $('.dropdown-toggle').dropdown('hide');
            $('span.show').removeClass("show");
        }
    },
    render: function () {
        var $climate_cont = $("<div class='col w-40'>")
            .append($("<div class='climate'>")
                .append($("<p class='desc'>"))
                .append($("<p class='temp'>"))
                .append($("<p class='min-max'>"))
                .append($("<p class='upper-border city'>").text("New York"))
                .append($("<p class='date'>").text("Updated Dec-06 12AM"))
                .append($("<span req-type='c' class='click cmd'>").text("C"))
                .append($("<span req-type='f' class='click cmd'>").text("F"))
                .append($("<span req-type='next' class='click cmd'>").html("&#x2192;"))
                .append($("<span req-type='prev' class='click cmd'>").html("&#x2190;"))
                .append($("<span req-type='edit'  class='click cmd fas fa-wrench'>"))
                .append($("<span req-type='geo'  class='click cmd fas fa-map-marker-alt'>"))
                .append($("<span req-type='update' class='click cmd fas fa-redo-alt'>"))
                .append($("<div class='btn-group drop'>")
                    .append($("<span class='dropdown-toggle'>"))
                    .append($("<div class='dropdown-menu'>")
                        .append($("<form class='px-3 py-1'>")
                            .append($("<div class='form-group'>")
                                .append($("<label class='text-sm font-weight-light text-uppercase' for='city'>").text("city:"))
                                .append($("<input class='form-control form-control-sm' type='text' id='city' required autofocus>")))
                            .append($("<div class='form-group'>")
                                .append($("<label class='font-weight-light text-uppercase' for='api_id'>").text("api_key:"))
                                .append($("<input class='form-control form-control-sm' type='text' id='api_id'>")))
                            .append($("<div class='form-group'>")
                                .append($("<label class='font-weight-light text-uppercase' for='timezone'>").text("time_zone:"))
                                .append($("<input class='form-control form-control-sm' type='number' max='23' min='-23' id='timezone'>")))
                            .append($("<div class='dropdown-divider'>"))
                            .append($("<div class='row justify-content-between px-3'>")
                                .append($("<button type='submit' req-type='save' class='btn btn-sm btn-outline-info cmd'>").text('Apply'))
                                .append($("<button req-type='cancel' class='btn btn-sm btn-outline-secondary cmd'>").text('Cancel'))
                            )
                        )
                    )
                )
            );


        var $fcst_col = $("<div class='col w-25'>").append(
            $("<div class='fcst'>")
                .append($("<p class='temp'>"))
                .append($("<p class='min-max'>"))
                .append($("<p class='upper-border day'>"))
                .append($("<p class='time'>").text("12:00 PM"))
        );

        var $fcst_row = $("<div class='row no-gutters fcst-row'>");
        for (var i = 0; i < 4; i++) {
            $fcst_row.append($fcst_col.clone());
        }

        var $fcst_cont = $("<div class='w-60'>");
        for (var i = 0; i < 2; i++) {
            $fcst_cont.append($fcst_row.clone());
        }

        var $row = $("<div class='row no-gutters'>")
            .append($climate_cont).append($fcst_cont);
        var $container = $("<div class='container-fluid pr-0 pl-0'>")
            .append($row);

        //use your main enclosure to contain this weather conatainer!
        $("#weather").append($container);

        for (var i = 0; i < $(".fcst").length; i++) {
            $(".fcst:nth(" + i + ")").attr("data-id", i);
        }
    },
    update_fcst: function () {
        var page = weather.forecast_page;
        //adjust the shifter
        if (8 + page * 8 > weather.forecast.length) {
            page = (weather.forecast.length - 9) / 8;
        }
        for (var i = 0; i < 8; i++) {
            var fcst = weather.forecast[i + (page * 8)];

            $(".fcst:nth(" + (i) + ")").attr("title", weather.capitaize(fcst.state[0].description));
            $(".fcst:nth(" + (i) + ")").css("background-image",
                "url('https://s1.twnmm.com/images/en_ca/icons/wxicons_large/" + fcst.state[0].icon + ".png')");
            $(".fcst .day:nth(" + (i) + ")").text(moment.unix(fcst.dt).utcOffset(weather.timezone).format("hh:mm A"));
            $(".fcst .time:nth(" + (i) + ")").text(moment.unix(fcst.dt).utcOffset(weather.timezone).format("ddd MM-DD"));

            var temp = Math.round(fcst.temp);
            var temp_max = Math.round(fcst.temp_max);
            var temp_min = Math.round(fcst.temp_min);
            if (weather.temp_id == 0) {
                temp = Math.round(temp * 1.8 + 32.0);
                temp_max = Math.round(temp_max * 1.8 + 32.0);
                temp_min = Math.round(temp_min * 1.8 + 32.0);
            }
            $(".fcst .temp:nth(" + (i) + ")").text(temp);
            $(".fcst .min-max:nth(" + (i) + ")").text(temp_max + " / " + temp_min);
        }
    },
    update_climate: function () {

        var temp = Math.round(weather.current.temp);
        var temp_min = Math.round(weather.current.temp_min);
        var temp_max = Math.round(weather.current.temp_max);
        if (weather.temp_id == 0) {
            temp = Math.round(temp * 1.8 + 32.0);
            temp_max = Math.round(temp_max * 1.8 + 32.0);
            temp_min = Math.round(temp_min * 1.8 + 32.0);
        }
        $(".climate").css("background-image", "url('https://s1.twnmm.com/images/en_ca/icons/wxicons_large/" + weather.current.state[0].icon + ".png')");
        $(".climate .temp").text(temp);
        $(".climate .min-max").text(temp_max + " / " + temp_min);
        $(".climate .desc").text(weather.capitaize(weather.current.state[0].description));
        $(".climate .city").text(weather.capitaize(weather.city.name.slice(0, 16)));
        $(".climate .date").text("Updated:" + moment.unix(weather.current.dt).utcOffset(weather.timezone).format(' hh:mm A "MM-DD"'));

        $("#city").val(weather.capitaize(weather.city.name))
        $("#api_id").val(weather.api_id)
        $("#timezone").val(weather.timezone / 60)
        if (weather.temp_id == 1) {
            $(".click:nth(0)").addClass("selected");
            $(".click:nth(1)").removeClass("selected");
        } else {
            $(".click:nth(1)").addClass("selected");
            $(".click:nth(0)").removeClass("selected");
        }
    },
    resize: function () {
        // > 1200 xl
        // > 992  lg
        // > 768  md
        // > 576  sm
        // < 576  sm
        var main_width = $(".climate").first().closest(".w-40").width() * 0.945;
        var width = $(".fcst").first().closest(".w-25").width() * 0.95;

        $(".climate").css({
            "background-position": "center " + (main_width * 0.175) + "px",
            "box-shadow": "0px 0px " + (main_width / 7.5) + "px 0.25px #000000",
            "border-radius": (main_width / 6.5) + "px",
            "padding-top": (main_width * 0.7) + "px",
            "padding-bottom": (main_width * 0.05) + "px",
            "width": (main_width) + "px",
            "background-size": (main_width * 0.5) + "px " + (main_width * 0.5) + "px"
        });
        $(".climate .upper-border").css({
            "margin-top": (main_width / 20) + "px",
            "border-top-width": (main_width / 150) + "px"
        });
        $(".climate .desc").css({
            "height": (main_width / 4) + "px",
            "width": (main_width * 0.9) + "px",
            "font-size": (main_width / 12) + "px"
        });
        $(".climate .temp").css({
            "font-size": (main_width / 4.5) + "px",
            "line-height": (main_width / 4.5) + "px",
            "letter-spacing": (main_width / 75) + "px",
        });
        $(".climate .min-max").css({
            //"margin-top":     (main_width/20) + "px",
            "font-size": (main_width / 10) + "px",
            "letter-spacing": (main_width / 125) + "px",
        });
        $(".climate .date").css({
            "font-size": (main_width / 15) + "px",
            "margin-top": (main_width / 20) + "px"
        });
        $(".climate .city").css("font-size", (main_width / 11) + "px");


        $(".fcst-row").css("margin-top", (width / 25) + "px");
        $(".fcst").css({
            "background-position": "center " + (width * 0.05) + "px",
            "box-shadow": "0px 0px " + (width / 10) + "px " + (width / 80) + "px #000000",
            "border-radius": (width / 6.5) + "px",
            "padding-top": (width * 0.85) + "px",
            "padding-bottom": (width * 0.1) + "px",
            "width": (width) + "px",
            "background-size": (width * 0.8) + "px " + (width * 0.8) + "px",
        });
        $(".fcst .upper-border").css({
            "margin-top": (width / 10) + "px",
            "border-top-width": (width / 60) + "px"
        });
        $(".fcst .temp").css({
            "font-size": (width / 3.75) + "px",
            "line-height": (width / 2.5) + "px",
            "letter-spacing": (width / 50) + "px"
        });
        $(".fcst .min-max").css({
            "font-size": (width / 5.5) + "px",
            "letter-spacing": (width / 150) + "px"
        });
        $(".fcst .day").css({
            "padding-top": (width / 9) + "px",
            "font-size": (width / 6.5) + "px"
        });
        $(".fcst .time").css("font-size", (width / 6.5) + "px");

        $(".click").css({
            "font-size": (main_width / 12.5) + "px",
            "line-height": (main_width / 12) + "px",
            "border-width": (main_width / 200) + "px",
            "height": (main_width / 9) + "px",
            "width": (main_width / 9) + "px",
            "border-radius": (main_width / 20) + "px",
            "box-shadow": "0px 0px 0px 0px #000000",
        });
        $('.selected').css({
            "box-shadow": "0px 0px " + (main_width * 0.065) + "px 0.25px #FFFFFF",
        });
        $(".click:nth(0)").css({
            "line-height": (main_width * 0.09) + "px",
            "top": (main_width * 1.17) + "px",
            "right": (main_width / 12.5) + "px"
        });
        $(".click:nth(1)").css({
            "line-height": (main_width * 0.09) + "px",
            "top": (main_width * 1.0) + "px",
            "right": (main_width / 12.5) + "px"
        });

        $(".click:nth(2)").css({
            "top": (main_width * 1.45) + "px",
            "right": (main_width / 16.5) + "px"
        });
        $(".click:nth(3)").css({
            "top": (main_width * 1.45) + "px",
            "left": (main_width / 16.5) + "px"
        });
        $(".click:nth(4)").css({
            "top": (main_width * 0.015) + "px",
            "left": (main_width * 0.25) + "px",
            "font-size": (main_width / 17.5) + "px",
            "line-height": (main_width * 0.1) + "px",
            "z-index": "1"
        });
        $(".click:nth(5)").css({
            "top": (main_width * 0.015) + "px",
            "left": (main_width * 0.475) + "px",
            "line-height": (main_width * 0.11) + "px",
        });
        $(".click:nth(6)").css({
            "top": (main_width * 0.015) + "px",
            "right": (main_width * 0.25) + "px",
            "font-size": (main_width / 17.5) + "px",
            "line-height": (main_width * 0.11) + "px",
        });
        $(".drop").css({
            "position": "absolute",
            "top": (main_width * 0.075) + "px",
            "left": (main_width * 0.08) + "px",
            "font-size": (main_width / 17.5) + "px",
        });
        $(".drop .dropdown-menu").css({
            "width": (main_width * 0.9) + "px"
        });

    },

}

$(window).resize(weather.resize);
$(document).on("click", ".cmd", weather.handle_click);

weather.initialize();