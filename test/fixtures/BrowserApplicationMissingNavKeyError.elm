module BrowserApplicationMissingNavKeyError exposing (Model, Msg(..), init, main, update, view)

import Browser
import Browser.Navigation
import Html exposing (Html, div, h1, img, text)
import Html.Attributes exposing (src)
import Url



{-

   This example is only intended to verify that we gracefully handle
   the case where the `Browser.Navigation.Key` cannot be found in the model.

   See https://github.com/klazuka/elm-hot/issues/15 for more details.

-}

main : Program () Model Msg
main =
    Browser.application
        { view = view
        , init = init
        , update = update
        , subscriptions = always Sub.none
        , onUrlChange = always NoOp
        , onUrlRequest = always NoOp
        }


type Model =
    FooBar


init : () -> Url.Url -> Browser.Navigation.Key -> ( Model, Cmd Msg )
init flags url navKey =
    -- IMPORTANT: do not store the nav key in the model
    ( FooBar, Cmd.none )


type Msg
    = NoOp


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    ( model, Cmd.none )


view : Model -> Browser.Document Msg
view model =
    { title = ""
    , body = [ text "hi" ]
    }


