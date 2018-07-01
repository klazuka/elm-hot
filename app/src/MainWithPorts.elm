port module MainWithPorts exposing (main)

import Browser
import Html exposing (Html, text)


port toJavaScript : Int -> Cmd msg


port fromJavaScript : (Int -> msg) -> Sub msg


type alias Model =
    Int


init : () -> ( Model, Cmd Msg )
init flags =
    ( 0, Cmd.none )


view : Model -> Html msg
view model =
    text (String.fromInt model)


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
