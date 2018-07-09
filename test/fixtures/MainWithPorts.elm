port module MainWithPorts exposing (main)

import Browser
import Html exposing (Html, button, div, h1, p, span, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)


port toJavaScript : Int -> Cmd msg


port fromJavaScript : (Int -> msg) -> Sub msg


type alias Model =
    Int


init : () -> ( Model, Cmd Msg )
init flags =
    ( 0, Cmd.none )


view : Model -> Html Msg
view model =
    div []
        [ h1 [] [ text "MainWithPorts" ]
        , p []
            [ text "Counter value is: "
            , span [ id "counter-value" ] [ text (String.fromInt model) ]
            ]
        , button [ onClick Increment, id "button-plus" ] [ text "+" ]
        ]


type Msg
    = Increment
    | GotNewValue Int


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        Increment ->
            ( model, toJavaScript model )

        GotNewValue n ->
            ( n + 1, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    fromJavaScript GotNewValue


main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
