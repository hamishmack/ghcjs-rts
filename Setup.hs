import Distribution.Simple (defaultMainWithHooks, simpleUserHooks, instHook, copyHook)
import Distribution.Simple.Setup (CopyDest(..), installVerbosity, copyVerbosity, fromFlag)
import Distribution.Simple.Utils (createDirectoryIfMissingVerbose, installOrdinaryFile)
import Distribution.Simple.LocalBuildInfo (buildDir, absoluteInstallDirs, InstallDirs(..))
import System.FilePath ((</>))

main = defaultMainWithHooks simpleUserHooks {
    instHook = (\pkg_descr lbi hooks flags -> do
        -- Run the normal install
        instHook simpleUserHooks pkg_descr lbi hooks flags

        -- Also copy the JavaScript RTS files
        let lib         = libdir $absoluteInstallDirs pkg_descr lbi NoCopyDest
            destination = lib </> "rts.jso"
            verbosity   = fromFlag (installVerbosity flags)
            copy n      = installOrdinaryFile verbosity n (destination </> n)

        createDirectoryIfMissingVerbose verbosity True destination
        copy "rts-common.js"
        copy "rts-plain.js"
        copy "rts-trampoline.js")

  , copyHook = (\pkg_descr lbi hooks flags -> do
        -- Run the normal copy
        copyHook simpleUserHooks pkg_descr lbi hooks flags

        -- Also copy the JavaScript RTS files
        let lib         = libdir $absoluteInstallDirs pkg_descr lbi NoCopyDest
            destination = lib </> "rts.jso"
            verbosity   = fromFlag (copyVerbosity flags)
            copy n      = installOrdinaryFile verbosity n (destination </> n)

        createDirectoryIfMissingVerbose verbosity True destination
        copy "rts-common.js"
        copy "rts-plain.js"
        copy "rts-trampoline.js")
  }
