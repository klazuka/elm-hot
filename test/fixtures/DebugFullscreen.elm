module DebugFullscreen exposing (..)

import Browser
import Html exposing (button, div, h1, p, span, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)


main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        }


type alias Flags =
    { n : Int }


type alias Model =
    { count : Int }


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( { count = flags.n }, Cmd.none )


type Msg
    = Increment


update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }
            , Cmd.none
            )


view model =
    { title = "DebugFullscreen"
    , body =
        [ h1 [] [ text "DebugFullscreen" ]
        , span [ id "code-version" ] [ text "code: v1" ]
        , p []
            [ text "Counter value is: "
            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
            ]
        , button [ onClick Increment, id "counter-button" ] [ text "+" ]
        ]
    }
