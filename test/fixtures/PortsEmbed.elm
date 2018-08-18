port module PortsEmbed exposing (main)

import Browser
import Html exposing (Html, button, div, h1, p, span, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)


main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


port toJavaScript : Int -> Cmd msg


port fromJavaScript : (Int -> msg) -> Sub msg


type alias Model =
    { count : Int }


init : () -> ( Model, Cmd Msg )
init flags =
    ( { count = 0 }, Cmd.none )


type Msg
    = Increment
    | GotNewValue Int


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        Increment ->
            ( model, toJavaScript model.count )

        GotNewValue n ->
            ( { model | count = model.count + 1 }, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    fromJavaScript GotNewValue


view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text "PortsEmbed" ]
        , span [ id "code-version" ] [ text "code: v1" ]
        , p []
            [ text "Counter value is: "
            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
            ]
        , button [ onClick Increment, id "counter-button" ] [ text "+" ]
        ]
