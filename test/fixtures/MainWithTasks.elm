module MainWithTasks exposing (..)

import Browser
import Html exposing (button, div, h1, p, span, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)
import Process
import Task


main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        }


type alias Model =
    { count : Int }


init : () -> ( Model, Cmd Msg )
init _ =
    ( { count = 0 }, Cmd.none )


type Msg
    = Increment
    | FinishedSleeping (Result String ())


millisToSleep =
    {- IMPORTANT: this MUST be in sync with the integration test -}
    5000


update msg model =
    case msg of
        Increment ->
            ( model
            , Task.attempt FinishedSleeping (Process.sleep millisToSleep)
            )

        FinishedSleeping result ->
            case result of
                Ok _ ->
                    ( { model | count = model.count + 1 }
                    , Cmd.none
                    )

                Err _ ->
                    ( model, Cmd.none )


view model =
    div []
        [ h1 [] [ text "MainWithTasks" ]
        , span [ id "code-version" ] [ text "code: v1" ]
        , p []
            [ text "Counter value is: "
            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
            ]
        , button [ onClick Increment, id "counter-button" ] [ text "+ (delayed)" ]
        ]
