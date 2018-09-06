module FullScreenEmptyInit exposing (..)

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


type alias Model =
    { count : Int }


init : () -> ( Model, Cmd Msg )
init flags =
    ( { count = 0 }, Cmd.none )


type Msg
    = Increment


update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }
            , Cmd.none
            )


view model =
    { title = "FullScreenEmptyInit"
    , body =
        [ h1 [] [ text "FullScreenEmptyInit" ]
        , span [ id "code-version" ] [ text "code: v1" ]
        , p []
            [ text "Counter value is: "
            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
            ]
        , button [ onClick Increment, id "counter-button" ] [ text "+" ]
        ]
    }
