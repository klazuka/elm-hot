port module MainWithPorts exposing (main)

import Browser
import Html exposing (Html, button, div, p, text)
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
        [ p [] [ text ("Current value is " ++ String.fromInt model) ]
        , button [ onClick Send, id "send-to-port" ] [ text "Send" ]
        ]


type Msg
    = Send
    | Got Int


update : Msg -> Model -> ( Model, Cmd msg )
update msg model =
    case msg of
        Send ->
            ( model, toJavaScript model )

        Got n ->
            ( n, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    fromJavaScript Got


main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
